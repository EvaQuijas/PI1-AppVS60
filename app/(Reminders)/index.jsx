import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  FlatList,
  Text,
  View,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { router } from "expo-router";
import styled from "styled-components/native";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useApp } from "../context/AppContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";

// Hook personalizado para permisos de notificación
const useNotificationPermissions = () => {
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setHasPermission(status === "granted");

        // Para Expo Go, simular permisos granted
        if (__DEV__) {
          console.log("🟡 Expo Go: Simulando permisos de notificación");
          setHasPermission(true); // Forzar como true en desarrollo
        }
      } catch (error) {
        console.log("Error checking permissions:", error);
        // En desarrollo, asumir que tenemos permisos
        if (__DEV__) {
          setHasPermission(true);
        }
      }
    };

    checkPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === "granted";
      setHasPermission(granted);

      // En Expo Go, siempre devolver true
      if (__DEV__) {
        console.log("🟡 Expo Go: Permisos simulados para desarrollo");
        return true;
      }

      return granted;
    } catch (error) {
      console.log("Error requesting permissions:", error);
      // En desarrollo, siempre devolver true
      if (__DEV__) {
        return true;
      }
      return false;
    }
  };

  return { hasPermission, requestPermissions };
};

const verifyPermissions = async () => {
  console.log("🔔 Verificando permisos...");

  if (hasPermission) {
    console.log("✅ Permisos ya concedidos");
    return true;
  }

  console.log("🟡 Solicitando permisos...");
  const granted = await requestPermissions();

  if (!granted) {
    console.log("❌ Permisos denegados");
    setShowPermissionAlert(true);
  } else {
    console.log("✅ Permisos concedidos");
  }

  return granted;
};

const RemindersScreen = () => {
  const { user } = useApp();
  const [reminders, setReminders] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);
  const insets = useSafeAreaInsets();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  const { hasPermission, requestPermissions } = useNotificationPermissions();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "reminders"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const remindersList = [];
      querySnapshot.forEach((doc) => {
        remindersList.push({ id: doc.id, ...doc.data() });
      });
      remindersList.sort((a, b) => a.date?.toDate() - b.date?.toDate());
      setReminders(remindersList);
    });

    return unsubscribe;
  }, [user]);


  // Función de prueba para verificar notificaciones
const testNotification = async () => {
  console.log('🔔 Probando notificación en 15 segundos...');
  
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Prueba exitosa',
        body: 'Notificación de prueba funcionando',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: { 
        seconds: 15, // 15 segundos para testing
      },
    });
    
    Alert.alert(
      'Prueba programada', 
      'Notificación en 15 segundos. Mantén la app en segundo plano.',
      [
        {
          text: 'OK',
          onPress: () => console.log('ID de notificación:', identifier)
        }
      ]
    );
  } catch (error) {
    console.log('❌ Error en prueba:', error);
    Alert.alert('Error', 'No se pudo programar la notificación de prueba');
  }
};
  // Función para programar notificación
  const schedulePushNotification = async (reminderTitle, reminderBody, reminderDate) => {
  const timeUntilNotification = (reminderDate.getTime() - new Date().getTime()) / 1000;
  
  console.log('⏰ Tiempo hasta notificación:', timeUntilNotification, 'segundos');
  
  if (timeUntilNotification > 0) {
    try {
      // FORZAR visualización incluso en primer plano
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ ${reminderTitle}`,
          body: reminderBody || 'Recordatorio',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          
          displayInForeground: true,
        },
        trigger: {
          seconds: timeUntilNotification,
        },
      });

      console.log('✅ Notificación programada ID:', identifier);
      return identifier;
    } catch (error) {
      console.log('❌ Error programando notificación:', error);
      throw error;
    }
  }
};

  // Verificar permisos
  const verifyPermissions = async () => {
    if (hasPermission) return true;

    const granted = await requestPermissions();
    if (!granted) {
      setShowPermissionAlert(true);
    }
    return granted;
  };

  const deleteReminder = async (reminderId, reminderTitle) => {
    Alert.alert(
      "¿Eliminar recordatorio?",
      `¿Estás segura de eliminar "${reminderTitle}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(
                doc(db, "users", user.uid, "reminders", reminderId)
              );
              Alert.alert("✅", "Recordatorio eliminado");
            } catch (error) {
              Alert.alert("❌", "Error al eliminar");
            }
          },
        },
      ]
    );
  };

  const openEditModal = (reminder = null) => {
    if (reminder) {
      setEditingReminder(reminder);
      setTitle(reminder.title);
      setDescription(reminder.description || "");
      setDate(reminder.date?.toDate() || new Date());
    } else {
      setEditingReminder(null);
      setTitle("");
      setDescription("");
      setDate(new Date());
    }
    setIsModalVisible(true);
  };

  const onDateChange = (event, selectedDate) => {
    // Para Android: DateTimePickerAndroid se cierra automáticamente
    if (Platform.OS === "android") {
      // No setShowDatePicker(false) porque se cierra solo
      if (selectedDate) {
        setDate(selectedDate);
      }
    } else {
      // Para iOS: cerrar el picker manualmente
      setShowDatePicker(false);
      if (selectedDate) {
        setDate(selectedDate);
      }
    }
  };

  const combineDateTime = (date, time) => {
    const combinedDate = new Date(date);
    const combinedTime = new Date(time);

    combinedDate.setHours(combinedTime.getHours());
    combinedDate.setMinutes(combinedTime.getMinutes());
    combinedDate.setSeconds(0);
    combinedDate.setMilliseconds(0);

    return combinedDate;
  };

  const handleSaveReminder = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "El título no puede estar vacío");
      return;
    }

    // Verificar permisos primero
    const hasPerms = await verifyPermissions();
    if (!hasPerms) return;

    try {
      const reminderData = {
        title: title.trim(),
        description: description.trim(),
        date: date,
        userId: user.uid,
        updatedAt: new Date(),
      };

      // Programar notificación
      await schedulePushNotification(title.trim(), description.trim(), date);

      if (editingReminder) {
        await updateDoc(
          doc(db, "users", user.uid, "reminders", editingReminder.id),
          reminderData
        );
        Alert.alert("✅", "Recordatorio actualizado con notificación");
      } else {
        reminderData.createdAt = new Date();
        await addDoc(
          collection(db, "users", user.uid, "reminders"),
          reminderData
        );
        Alert.alert("✅", "Recordatorio creado con notificación");
      }

      setIsModalVisible(false);
      setEditingReminder(null);
      setTitle("");
      setDescription("");
      setDate(new Date());
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("❌", "Error al guardar el recordatorio");
    }
  };

  const handleCancelEdit = () => {
    setIsModalVisible(false);
    setEditingReminder(null);
    setTitle("");
    setDescription("");
    setDate(new Date());
  };

  return (
    <Container>
      <HeaderContainer style={{ paddingTop: insets.top + 15 }}>
        <BackButton onPress={() => router.back()}>
          <BackText>{"<"}</BackText>
        </BackButton>
        <Title>Mis Recordatorios</Title>
      </HeaderContainer>

      <AddButton onPress={() => openEditModal()}>
        <ButtonText>+ Nuevo Recordatorio</ButtonText>
      </AddButton>


      // Agrega este botón en tu return:
<TouchableOpacity 
  onPress={testNotification}
  style={{
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  }}
>
  <Text style={{ color: 'white', fontWeight: '600' }}>
    🔔 Probar Notificación (15 seg)
  </Text>
</TouchableOpacity>

    {/*   
      <TouchableOpacity
        onPress={async () => {
          console.log("🔔 Probando notificación inmediata...");
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "✅ Prueba exitosa",
              body: "Las notificaciones están funcionando",
              sound: "default",
            },
            trigger: { seconds: 2 }, // 2 segundos
          });
          Alert.alert("Prueba", "Notificación programada para 2 segundos");
        }}
        style={{
          backgroundColor: "#9b59b6",
          padding: 15,
          borderRadius: 10,
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>
          🔔 Probar Notificación Inmediata
        </Text> 
      </TouchableOpacity> */}

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReminderCard>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#2c3e50",
                  marginBottom: 5,
                }}
              >
                {item.title}
              </Text>
              {item.description ? (
                <Text
                  style={{ color: "#7f8c8d" }}
                  numberOfLines={3}
                  ellipsizeMode="tail"
                >
                  {item.description}
                </Text>
              ) : (
                <Text style={{ color: "#bdc3c7", fontStyle: "italic" }}>
                  Sin descripción...
                </Text>
              )}
              <Text
                style={{
                  color: "#e74c3c",
                  fontSize: 14,
                  marginTop: 10,
                  fontWeight: "500",
                }}
              >
                ⏰ {item.date?.toDate().toLocaleDateString()} -{" "}
                {item.date?.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={() => openEditModal(item)}
                style={{ padding: 8, marginRight: 5 }}
              >
                <Text style={{ color: "#3498db", fontSize: 18 }}>✏️</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => deleteReminder(item.id, item.title)}
                style={{ padding: 8 }}
              >
                <Text style={{ color: "#e74c3c", fontSize: 18 }}>❌</Text>
              </TouchableOpacity>
            </View>
          </ReminderCard>
        )}
        ListEmptyComponent={
          <Text
            style={{ textAlign: "center", color: "#7f8c8d", marginTop: 20 }}
          >
            No hay recordatorios aún
          </Text>
        }
      />

      {/* Modal para crear/editar recordatorios */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCancelEdit}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ModalOverlay onPress={handleCancelEdit}>
            <ModalContent onPress={(e) => e.stopPropagation()}>
              <ModalTitle>
                {editingReminder ? "Editar Recordatorio" : "Nuevo Recordatorio"}
              </ModalTitle>

              <InputLabel>Título *</InputLabel>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 15,
                  fontSize: 16,
                }}
                value={title}
                onChangeText={setTitle}
                placeholder="Título del recordatorio"
              />

              <InputLabel>Descripción</InputLabel>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 15,
                  fontSize: 16,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
                value={description}
                onChangeText={setDescription}
                placeholder="Descripción del recordatorio..."
                multiline={true}
                numberOfLines={3}
              />

              <InputLabel>Fecha y Hora *</InputLabel>

              {/* SELECTOR DE FECHA */}
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === "android") {
                    DateTimePickerAndroid.open({
                      value: selectedDate,
                      onChange: (event, date) => {
                        if (date) {
                          setSelectedDate(date);
                          setDate(combineDateTime(date, selectedTime));
                        }
                      },
                      mode: "date",
                    });
                  } else {
                    setShowDatePicker(true);
                  }
                }}
                style={inputStyle}
              >
                <Text style={{ fontSize: 16, color: "#2c3e50" }}>
                  📅 {selectedDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              {/* SELECTOR DE HORA */}
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === "android") {
                    DateTimePickerAndroid.open({
                      value: selectedTime,
                      onChange: (event, time) => {
                        if (time) {
                          setSelectedTime(time);
                          setDate(combineDateTime(selectedDate, time));
                        }
                      },
                      mode: "time",
                      is24Hour: true,
                    });
                  } else {
                    setShowTimePicker(true);
                  }
                }}
                style={inputStyle}
              >
                <Text style={{ fontSize: 16, color: "#2c3e50" }}>
                  ⏰{" "}
                  {selectedTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && Platform.OS === "ios" && (
                <DateTimePicker
                  value={date}
                  mode="datetime"
                  display="spinner"
                  onChange={onDateChange}
                  style={{ width: "100%" }}
                />
              )}

              <ButtonContainer>
                <CancelButton onPress={handleCancelEdit}>
                  <ButtonTextWhite>Cancelar</ButtonTextWhite>
                </CancelButton>

                <SaveButton onPress={handleSaveReminder}>
                  <ButtonTextWhite>
                    {editingReminder ? "Actualizar" : "Crear"}
                  </ButtonTextWhite>
                </SaveButton>
              </ButtonContainer>
            </ModalContent>
          </ModalOverlay>
        </KeyboardAvoidingView>
      </Modal>
    </Container>
  );
};

// Styled Components (usando los mismos estilos que Notas con pequeñas modificaciones)
const Container = styled.View`
  flex: 1;
  padding: 20px;
  background-color: #faf9ee;
`;

const HeaderContainer = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 25px;
  background-color: #eceedf;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  margin-bottom: 15px;
`;

const BackButton = styled.TouchableOpacity`
  margin-right: 40px;
`;

const BackText = styled.Text`
  color: #26667f;
  font-size: 20px;
  font-weight: bold;
`;

const Title = styled.Text`
  color: #26667f;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  flex: 1;
`;

const AddButton = styled.TouchableOpacity`
  background-color: #26667f;
  padding: 15px;
  border-radius: 10px;
  align-items: center;
  margin-bottom: 20px;
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 600;
`;

const ReminderCard = styled.View`
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 15px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
`;

// Modal Styles
const ModalOverlay = styled.TouchableOpacity`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ModalContent = styled.TouchableOpacity`
  background-color: white;
  border-radius: 15px;
  padding: 25px;
  width: 100%;
  max-width: 400px;
`;

const ModalTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #26667f;
  margin-bottom: 20px;
  text-align: center;
`;

const InputLabel = styled.Text`
  font-size: 16px;
  color: #2c3e50;
  margin-bottom: 8px;
  font-weight: 500;
`;

const ButtonContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 10px;
`;

const CancelButton = styled.TouchableOpacity`
  background-color: #e74c3c;
  padding: 15px;
  border-radius: 10px;
  flex: 1;
  margin-right: 10px;
  align-items: center;
`;

const SaveButton = styled.TouchableOpacity`
  background-color: #2ecc71;
  padding: 15px;
  border-radius: 10px;
  flex: 1;
  margin-left: 10px;
  align-items: center;
`;

const ButtonTextWhite = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 600;
`;

const inputStyle = {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 8,
  padding: 12,
  marginBottom: 15,
  fontSize: 16,
};

export default RemindersScreen;

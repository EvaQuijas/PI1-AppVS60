import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import {
  addDoc, // 
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react"; 
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { db } from "../config/firebase";
import { useApp } from "../context/AppContext";

import { Timestamp } from "firebase/firestore";

const AlarmasScreen = () => {
  const { user } = useApp();
  const [alarms, setAlarms] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState(null);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState(new Date());
  const [repeat, setRepeat] = useState("none");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const insets = useSafeAreaInsets();
  const [selectedDays, setSelectedDays] = useState([]);
  const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "alarms"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const alarmsList = [];
      querySnapshot.forEach((doc) => {
        alarmsList.push({ id: doc.id, ...doc.data() });
      });
      alarmsList.sort((a, b) => a.time?.toDate() - b.time?.toDate());
      setAlarms(alarmsList);
    });

    return unsubscribe;
  }, [user]);

  const deleteAlarm = async (alarmId, alarmTitle) => {
    Alert.alert(
      "¿Eliminar alarma?",
      `¿Estás segura de eliminar "${alarmTitle}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "users", user.uid, "alarms", alarmId));
              Alert.alert("✅", "Alarma eliminada");
            } catch (error) {
              Alert.alert("❌", "Error al eliminar");
            }
          },
        },
      ]
    );
  };

  const openEditModal = (alarm = null) => {
    if (alarm) {
      setEditingAlarm(alarm);
      setTitle(alarm.title);
      setTime(alarm.time?.toDate() || new Date());
      setRepeat(alarm.repeat || "custom");
      setSelectedDays(alarm.days || []);
    } else {
      setEditingAlarm(null);
      setTitle("");
      setTime(new Date());
      setRepeat("none");
      setSelectedDays([]);
    }
    setIsModalVisible(true);
  };
  const onTimeChange = (event, selectedTime) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
      if (selectedTime) {
        setTime(selectedTime);
      }
    } else {
      setShowTimePicker(false);
      if (selectedTime) {
        setTime(selectedTime);
      }
    }
  };

  const handleSaveAlarm = async () => {
    console.log("🔄 Intentando guardar alarma...");
    console.log("👤 Usuario UID:", user?.uid);

    if (!title.trim()) {
      Alert.alert("Error", "El título no puede estar vacío");
      return;
    }

    try {
      console.log("📝 Datos de la alarma:", {
        title: title.trim(),
        time: time,
        repeat: repeat,
        selectedDays: selectedDays,
      });

      const alarmData = {
        title: title.trim(),
        time: Timestamp.fromDate(time), // Convertir a Timestamp de Firestore
        repeat: repeat,
        userId: user.uid,
        updatedAt: Timestamp.now(), // Usar Timestamp
        enabled: true,
      };

      // Y para crear:
      alarmData.createdAt = Timestamp.now();

      // Solo agregar días si es repetición personalizada
      if (repeat === "custom" && selectedDays.length > 0) {
        alarmData.days = selectedDays;
      }

      console.log("🔥 Enviando a Firestore:", alarmData);

      if (editingAlarm) {
        console.log("✏️ Actualizando alarma existente...");
        await updateDoc(
          doc(db, "users", user.uid, "alarms", editingAlarm.id),
          alarmData
        );
        Alert.alert("✅", "Alarma actualizada");
      } else {
        console.log("➕ Creando nueva alarma...");
        alarmData.createdAt = new Date();
        await addDoc(collection(db, "users", user.uid, "alarms"), alarmData);
        Alert.alert("✅", "Alarma creada");
      }

      console.log("✅ Alarma guardada exitosamente en Firestore");

      setIsModalVisible(false);
      setEditingAlarm(null);
      setTitle("");
      setTime(new Date());
      setRepeat("none");
      setSelectedDays([]);
    } catch (error) {
      console.log("❌ Error completo al guardar alarma:", error);
      console.log("❌ Mensaje de error:", error.message);
      Alert.alert("❌", "Error al guardar la alarma: " + error.message);
    }
  };

  const scheduleAlarmNotification = async (alarmData, alarmId) => {
    try {
      // Calcular el tiempo hasta la alarma
      const now = new Date();
      const alarmTime = new Date(alarmData.time);

      // Configurar la hora de la alarma
      const notificationTime = new Date();
      notificationTime.setHours(alarmTime.getHours());
      notificationTime.setMinutes(alarmTime.getMinutes());
      notificationTime.setSeconds(0);

      // Si la hora ya pasó hoy, programar para mañana
      if (notificationTime < now) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }

      const timeUntilAlarm = notificationTime.getTime() - now.getTime();

      if (timeUntilAlarm > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `⏰ ${alarmData.title}`,
            body: "¡Es hora de tu alarma!",
            sound: "default",
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            seconds: timeUntilAlarm / 1000,
          },
        });

        console.log(
          "🔔 Notificación programada para:",
          notificationTime.toLocaleString()
        );
      }
    } catch (error) {
      console.log("❌ Error programando notificación:", error);
    }
  };

  const handleCancelEdit = () => {
    setIsModalVisible(false);
    setEditingAlarm(null);
    setTitle("");
    setTime(new Date());
    setRepeat("none");
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const toggleAlarm = async (alarm) => {
    try {
      await updateDoc(doc(db, "users", user.uid, "alarms", alarm.id), {
        enabled: !alarm.enabled,
        updatedAt: new Date(),
      });
    } catch (error) {
      Alert.alert("❌", "Error al cambiar estado de la alarma");
    }
  };

  return (
    <Container>
      <HeaderContainer style={{ paddingTop: insets.top + 15 }}>
        <BackButton onPress={() => router.back()}>
          <BackText>{"<"}</BackText>
        </BackButton>
        <Title>Mis Alarmas</Title>
      </HeaderContainer>

      <AddButton onPress={() => openEditModal()}>
        <ButtonText>+ Nueva Alarma</ButtonText>
      </AddButton>

      {/* PRUEBA DE NOTIFICACIÓN */}
      <TouchableOpacity
        onPress={async () => {
          console.log("🔔 Probando notificación...");
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "⏰ Alarma de Prueba",
              body: "¡Esta es una notificación de prueba!",
              sound: "default",
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
              seconds: 5, // 5 segundos para testing
            },
          });
          Alert.alert(
            "Prueba exitosa",
            "Notificación programada para 5 segundos"
          );
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
          🔔 Probar Notificación (5 seg)
        </Text>
      </TouchableOpacity>

      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlarmCard>
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
              <Text
                style={{ color: "#e74c3c", fontSize: 16, fontWeight: "500" }}
              >
                ⏰{" "}
                {item.time?.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              {item.repeat === "daily" && (
                <Text style={{ color: "#7f8c8d", fontSize: 14, marginTop: 5 }}>
                  Repetir: Diariamente
                </Text>
              )}
              {item.repeat === "custom" &&
                item.days &&
                item.days.length > 0 && (
                  <Text
                    style={{ color: "#7f8c8d", fontSize: 14, marginTop: 5 }}
                  >
                    Días: {item.days.map((day) => daysOfWeek[day]).join(", ")}
                  </Text>
                )}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => toggleAlarm(item)}
                style={{ padding: 8, marginRight: 5 }}
              >
                <Text
                  style={{
                    color: item.enabled ? "#2ecc71" : "#95a5a6",
                    fontSize: 18,
                  }}
                >
                  {item.enabled ? "🔔" : "🔕"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => openEditModal(item)}
                style={{ padding: 8, marginRight: 5 }}
              >
                <Text style={{ color: "#3498db", fontSize: 18 }}>✏️</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => deleteAlarm(item.id, item.title)}
                style={{ padding: 8 }}
              >
                <Text style={{ color: "#e74c3c", fontSize: 18 }}>❌</Text>
              </TouchableOpacity>
            </View>
          </AlarmCard>
        )}
        ListEmptyComponent={
          <Text
            style={{ textAlign: "center", color: "#7f8c8d", marginTop: 20 }}
          >
            No hay alarmas aún
          </Text>
        }
      />

      {/* Modal para crear/editar alarmas */}
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
                {editingAlarm ? "Editar Alarma" : "Nueva Alarma"}
              </ModalTitle>

              <InputLabel>Nombre de la alarma *</InputLabel>
              <TextInput
                style={inputStyle}
                value={title}
                onChangeText={setTitle}
                placeholder="Ej: Tomar medicamento, Despertar, etc."
              />

              <InputLabel>Hora *</InputLabel>
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === "android") {
                    DateTimePickerAndroid.open({
                      value: time,
                      onChange: onTimeChange,
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
                  {time.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>

              {Platform.OS === "ios" && showTimePicker && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display="spinner"
                  onChange={onTimeChange}
                />
              )}

              <InputLabel>Repetir</InputLabel>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                <TouchableOpacity
                  onPress={() => setRepeat("none")}
                  style={{
                    width: "30%",
                    padding: 12,
                    backgroundColor: repeat === "none" ? "#26667F" : "#f8f9fa",
                    borderRadius: 8,
                    marginBottom: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: repeat === "none" ? "white" : "#2c3e50",
                      fontSize: 12,
                    }}
                  >
                    No repetir
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRepeat("daily")}
                  style={{
                    width: "30%",
                    padding: 12,
                    backgroundColor: repeat === "daily" ? "#26667F" : "#f8f9fa",
                    borderRadius: 8,
                    marginBottom: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: repeat === "daily" ? "white" : "#2c3e50",
                      fontSize: 12,
                    }}
                  >
                    Diario
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRepeat("custom")}
                  style={{
                    width: "30%",
                    padding: 12,
                    backgroundColor:
                      repeat === "custom" ? "#26667F" : "#f8f9fa",
                    borderRadius: 8,
                    marginBottom: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: repeat === "custom" ? "white" : "#2c3e50",
                      fontSize: 12,
                    }}
                  >
                    Personalizado
                  </Text>
                </TouchableOpacity>
              </View>

              {/* días personalizados */}
              {repeat === "custom" && (
                <View>
                  <InputLabel>Seleccionar días:</InputLabel>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 20,
                    }}
                  >
                    {daysOfWeek.map((day, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => toggleDay(index)}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: selectedDays.includes(index)
                            ? "#26667F"
                            : "#f8f9fa",
                          justifyContent: "center",
                          alignItems: "center",
                          margin: 2,
                        }}
                      >
                        <Text
                          style={{
                            color: selectedDays.includes(index)
                              ? "white"
                              : "#2c3e50",
                            fontSize: 12,
                            fontWeight: "bold",
                          }}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <ButtonContainer>
                <CancelButton onPress={handleCancelEdit}>
                  <ButtonTextWhite>Cancelar</ButtonTextWhite>
                </CancelButton>

                <SaveButton onPress={handleSaveAlarm}>
                  <ButtonTextWhite>
                    {editingAlarm ? "Actualizar" : "Crear"}
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

// Styled Components (us0 los mismos estilos)
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

const AlarmCard = styled.View`
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
  align-items: center;
`;

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
  background-color: #386641;
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

export default AlarmasScreen;

import { router } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react'; // useState y useEffect
import { ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import styled from 'styled-components/native';
import { db } from '../config/firebase';
import { useApp } from '../context/AppContext';

const Dashboard = () => {
    const { user, logout } = useApp();
    const [selectedDate, setSelectedDate] = useState('');
    const [reminders, setReminders] = useState([]);
    const [markedDates, setMarkedDates] = useState({});

    // Cargar recordatorios desde Firestore
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'users', user.uid, 'reminders'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const remindersList = [];
            const newMarkedDates = {};
            
            querySnapshot.forEach((doc) => {
                const reminder = { id: doc.id, ...doc.data() };
                remindersList.push(reminder);
                
                // Crear marcadores para el calendario
                if (reminder.date) {
                    const dateString = reminder.date.toDate().toISOString().split('T')[0];
                    newMarkedDates[dateString] = { 
                        marked: true, 
                        dotColor: '#e74c3c',
                        selected: dateString === selectedDate
                    };
                }
            });
            
            setReminders(remindersList);
            setMarkedDates(newMarkedDates);
        });

        return unsubscribe;
    }, [user, selectedDate]);

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/(auth)/Login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    const menuItems = [
        { title: '🚨 EMERGENCIA', icon: '🚨', screen: '/(Emergencia)', color: '#e74c3c', priority: true },
        { title: 'Registro de salud', icon: '🤍', screen: '/(RegistroSalud)', color: '#e74c3c' },
        { title: 'Notas', icon: '📝', screen: '/(Notas)', color: '#9b59b6' },
        { title: 'Recordatorios', icon: '⏰', screen: '/(Reminders)', color: '#3498db' },
        { title: 'Alarmas', icon: '🔔', screen: '/(Alarmas)', color: '#9A3F3F' },
        { title: 'Llamada rápida', icon: '📞', screen: '/(EmergencyContact)', color: '#2ecc71' },
        { title: 'Enviar ubicación', icon: '📌', screen: '/(Ubicacion)/', color: '#f39c12' }, 
        { title: 'Compra', icon: '💊', screen: '/(Farmacia)', color: '#708993' },
    ];

    // Función para obtener recordatorios de la fecha seleccionada
    const getRemindersForSelectedDate = () => {
        if (!selectedDate) return [];
        return reminders.filter(reminder => {
            const reminderDate = reminder.date?.toDate().toISOString().split('T')[0];
            return reminderDate === selectedDate;
        });
    };

    const selectedDateReminders = getRemindersForSelectedDate();

    return (
        <Container>
            <Header>
                <HeaderContent>
                    <Logo source={require('../../assets/images/icon-app.png')} />

                    <UserInfo>
                        <UserGreeting>Hola, {user?.displayName || user?.email?.split('@')[0] || 'Usuario'}</UserGreeting>
                        <LogoutButton onPress={handleLogout}>
                            <LogoutText>Cerrar sesión</LogoutText>
                        </LogoutButton>
                    </UserInfo>
                </HeaderContent>

                <WelcomeText>Bienvenido a Vida Saludable</WelcomeText>
            </Header>

            <ScrollView>
                {/* 🚨 BOTÓN DE EMERGENCIA DESTACADO */}
                <EmergencySection>
                    <EmergencyCard
                        onPress={() => router.push('/(Emergencia)')}
                    >
                        <EmergencyIconContainer>
                            <EmergencyIcon>🚨</EmergencyIcon>
                        </EmergencyIconContainer>
                        <EmergencyContent>
                            <EmergencyTitle>EMERGENCIA</EmergencyTitle>
                            <EmergencySubtitle>Activar ayuda inmediata</EmergencySubtitle>
                        </EmergencyContent>
                        <EmergencyArrow>→</EmergencyArrow>
                    </EmergencyCard>
                </EmergencySection>

                {/* 📱 GRID DE MÓDULOS REGULARES */}
                <Grid>
                    {menuItems.filter(item => !item.priority).map((item, index) => (
                        <MenuCard
                            key={index}
                            onPress={() => router.push(item.screen)}
                            style={{ backgroundColor: item.color + '20' }}
                        >
                            <IconContainer style={{ backgroundColor: item.color }}>
                                <CardTitle style={{ color: 'white', fontSize: 24 }}>{item.icon}</CardTitle>
                            </IconContainer>
                            <CardTitle>{item.title}</CardTitle>
                        </MenuCard>
                    ))}
                </Grid>

                <CalendarContainer>
                    <CalendarTitle>Calendario de Recordatorios</CalendarTitle>
                    <Calendar
                        current={new Date().toISOString().split('T')[0]}
                        onDayPress={(day) => {
                            setSelectedDate(day.dateString);
                        }}
                        markedDates={markedDates}
                        theme={{
                            textDayFontSize: 18,
                            textMonthFontSize: 20,
                            textDayHeaderFontSize: 16,
                            selectedDayBackgroundColor: '#FF6B6B',
                            selectedDayTextColor: 'white',
                            todayTextColor: '#FF6B6B',
                            arrowColor: '#FF6B6B',
                            textDayStyle: { fontSize: 18, fontWeight: 'bold' },
                            textDisabledColor: '#CCCCCC',
                        }}
                        style={{
                            height: 380,
                            width: '100%',
                        }}
                    />

                    {/* Mostrar recordatorios de la fecha seleccionada */}
                    {selectedDate && (
                        <SelectedDateContainer>
                            <SelectedDateTitle>
                                Recordatorios para {new Date(selectedDate).toLocaleDateString()}
                            </SelectedDateTitle>
                            
                            {selectedDateReminders.length > 0 ? (
                                selectedDateReminders.map(reminder => (
                                    <ReminderItem key={reminder.id}>
                                        <ReminderTitle>⏰ {reminder.title}</ReminderTitle>
                                        {reminder.description && (
                                            <ReminderDescription>
                                                {reminder.description}
                                            </ReminderDescription>
                                        )}
                                        <ReminderTime>
                                            {reminder.date?.toDate().toLocaleTimeString([], { 
                                                hour: '2-digit', minute: '2-digit' 
                                            })}
                                        </ReminderTime>
                                    </ReminderItem>
                                ))
                            ) : (
                                <NoRemindersText>No hay recordatorios para esta fecha</NoRemindersText>
                            )}
                        </SelectedDateContainer>
                    )}
                </CalendarContainer>

            </ScrollView>
        </Container>
    );
};

// Styled Components
const Container = styled.View`
  flex: 1;
  background-color: #ECEEDF;
`;

const Header = styled.View`
  background-color: #26667F;
  padding: 20px;
  padding-top: 50px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
`;

const HeaderContent = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.Image`
  width: 50px;
  height: 50px;
  border-radius: 25px;
`;

const UserInfo = styled.View`
  flex-direction: row;
  align-items: center;
`;

const UserGreeting = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin-right: 15px;
`;

const LogoutButton = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.2);
  padding: 8px 12px;
  border-radius: 20px;
`;

const LogoutText = styled.Text`
  color: white;
  font-size: 14px;
`;

const WelcomeText = styled.Text`
  color: white;
  font-size: 24px;
  font-weight: bold;
  margin-top: 10px;
`;

const Grid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 20px;
`;

const MenuCard = styled.TouchableOpacity`
  background-color: white;
  width: 48%;
  height: 140px;
  border-radius: 15px;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const IconContainer = styled.View`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
`;

const CardTitle = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
`;

const CalendarContainer = styled.View`
  background-color: white;
  margin: 15px;
  border-radius: 15px;
  padding: 15px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const CalendarTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 15px;
  text-align: center;
`;

// Añadir estos styled components al final
const SelectedDateContainer = styled.View`
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 10px;
`;

const SelectedDateTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 10px;
`;

const ReminderItem = styled.View`
  background-color: white;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
  border-left-width: 4px;
  border-left-color: #e74c3c;
`;

const ReminderTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
`;

const ReminderDescription = styled.Text`
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 5px;
`;

const ReminderTime = styled.Text`
  font-size: 12px;
  color: #95a5a6;
  font-weight: 500;
`;

const NoRemindersText = styled.Text`
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
`;

// 🚨 Styled Components para el botón de emergencia destacado
const EmergencySection = styled.View`
  padding: 20px;
  padding-bottom: 10px;
`;

const EmergencyCard = styled.TouchableOpacity`
  background-color: #e74c3c;
  flex-direction: row;
  align-items: center;
  padding: 20px;
  border-radius: 15px;
  shadow-color: #e74c3c;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 8;
`;

const EmergencyIconContainer = styled.View`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: rgba(255, 255, 255, 0.2);
  justify-content: center;
  align-items: center;
  margin-right: 15px;
`;

const EmergencyIcon = styled.Text`
  font-size: 30px;
`;

const EmergencyContent = styled.View`
  flex: 1;
`;

const EmergencyTitle = styled.Text`
  color: white;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 5px;
`;

const EmergencySubtitle = styled.Text`
  color: white;
  font-size: 14px;
  opacity: 0.9;
`;

const EmergencyArrow = styled.Text`
  color: white;
  font-size: 24px;
  font-weight: bold;
`;

export default Dashboard;
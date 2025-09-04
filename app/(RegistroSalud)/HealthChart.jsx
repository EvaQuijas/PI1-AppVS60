import React from 'react';
import { View, Text, Dimensions, Platform } from 'react-native'; // ✅ Import completo
import {LineChart} from 'react-native-chart-kit';
import styled from 'styled-components/native';

const HealthChart = ({ records, category }) => {
  // Solo mostrar en móvil
  if (Platform.OS === 'web') {
    return (
      <ChartContainer>
        <ChartTitle>Gráfica de {category?.name}</ChartTitle>
        <Text style={{ textAlign: 'center', color: '#7f8c8d' }}>
          Las gráficas están disponibles solo en la app móvil
        </Text>
      </ChartContainer>
    );
  }

  if (!records || records.length < 2) {
    return (
      <ChartContainer>
        <ChartTitle>Gráfica de {category?.name}</ChartTitle>
        <Text style={{ textAlign: 'center', color: '#7f8c8d' }}>
          Necesitas al menos 2 registros para generar la gráfica
        </Text>
      </ChartContainer>
    );
  }

  const chartData = {
    labels: records.slice(-7).map(record => 
      record.date?.toDate().toLocaleDateString('es-MX', { 
        day: 'numeric',
        month: 'short'
      }) || ''
    ),
    datasets: [{
      data: records.slice(-7).map(record => {
        const value = parseFloat(record.value.toString().split('/')[0]);
        return isNaN(value) ? 0 : value;
      }),
    }]
  };

  return (
    <ChartContainer>
      <ChartTitle>Evolución de {category?.name}</ChartTitle>
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width - 60}
        height={220}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(38, 102, 127, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: { borderRadius: 16 },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#26667F',
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </ChartContainer>
  );
};



export default HealthChart;

const ChartContainer = styled.View`
  background-color: white;
  padding: 15px;
  border-radius: 15px;
  margin: 15px 0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const ChartTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #26667F;
  margin-bottom: 15px;
  text-align: center;
`;
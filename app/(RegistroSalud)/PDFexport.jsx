import * as Print from 'expo-print'; // Se descarga
import * as Sharing from 'expo-sharing'; //  Se descarga
import { Alert, Text } from 'react-native';
import styled from 'styled-components/native';

const ExportButton = styled.TouchableOpacity`
  background-color: #BBDCE5;
  padding: 15px;
  border-radius: 10px;
  align-items: center;
  margin: 10px 0;
`;

const ExportPDF = ({ category, records }) => {
  const generatePDF = async () => {
    try {

       if (!category) {
      Alert.alert('Error', 'La información de la categoría no está cargada. Espera un momento.'); 
       return;
    }
      console.log("📊 Generando PDF para:", category?.name);
      if (!category || records.length === 0) {
      Alert.alert('Info', 'No hay datos para generar el reporte');
      return;
    }
   
      console.log("📝 Registros:", records.length);

       if (!records || !Array.isArray(records)) {
      Alert.alert('Error', 'No hay datos válidos para generar el reporte');
      return;
    }

    // ✅ FILTRAR registros válidos
    const validRecords = records.filter(record => record && record.value);
    
    if (validRecords.length === 0) {
      Alert.alert('Info', 'No hay registros válidos para generar el reporte');
      return;
    }

    const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Reporte de Salud</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #26667F; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>📊 ${category?.name} - Reporte</h1>
            <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString()}</p>
            
            <table>
              <tr>
                <th>Fecha</th>
                <th>Valor</th>
                <th>Notas</th>
              </tr>
              ${validRecords.map(record => `
                <tr>
                  <td>${record.date?.toDate?.()?.toLocaleDateString() || 'N/A'}</td>
                  <td>${record.value} ${category?.unit || ''}</td>
                  <td>${record.notes || '-'}</td>
                </tr>
              `).join('')}
            </table>
          </body>
        </html>
      `;
      

      const options = {
        html,
        fileName: `Reporte_${category?.name}_${new Date().getTime()}`,
        directory: 'Documents',
      };

      const file = await Print.printToFileAsync({ html });

      console.log(file.filePath);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri);
      } else {
        Alert.alert('PDF generado', `Guardado en: ${file.uri}`);
        console.log("📄 Archivo creado:", file);
      }

      

    } catch (error) {
    console.error("❌ Error completo:", error);
    Alert.alert('Error', 'No se pudo generar el PDF: ' + error.message);
  }
};



  return (
    <ExportButton onPress={generatePDF}>
      <Text style={{ color: 'black', fontWeight: '800' }}>📄 Exportar PDF</Text>
    </ExportButton>
  );
};

export default ExportPDF;




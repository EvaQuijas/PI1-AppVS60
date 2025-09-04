import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Text } from 'react-native';
import styled from 'styled-components/native';

const ExportButton = styled.TouchableOpacity`
  background-color: #BBDCE5;
  padding: 15px;
  border-radius: 10px;
  align-items: center;
  margin: 10px 0;
`;

const ExportPDF = ({ notes }) => {
  const generatePDF = async () => {
    try {
      if (!notes || notes.length === 0) {
        Alert.alert('Info', 'No hay notas para generar el reporte');
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Mis Notas</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #26667F; text-align: center; }
              .note { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
              .note-title { font-size: 18px; font-weight: bold; color: #2c3e50; margin-bottom: 8px; }
              .note-content { color: #7f8c8d; margin-bottom: 10px; white-space: pre-wrap; }
              .note-date { color: #95a5a6; font-size: 12px; text-align: right; }
              .page-break { page-break-after: always; }
            </style>
          </head>
          <body>
            <h1>📝 Mis Notas</h1>
            <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Total de notas:</strong> ${notes.length}</p>
            
            ${notes.map(note => `
              <div class="note">
                <div class="note-title">${note.title || 'Sin título'}</div>
                <div class="note-content">${note.content || 'Sin contenido'}</div>
                <div class="note-date">
                  ${note.updatedAt?.toDate?.()?.toLocaleDateString() || 
                    note.createdAt?.toDate?.()?.toLocaleDateString() || ''}
                </div>
              </div>
            `).join('')}
          </body>
        </html>
      `;

      // Generar el PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Compartir directamente
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir PDF de Notas',
        UTI: 'com.adobe.pdf'
      });

    } catch (error) {
      console.error("❌ Error al generar PDF:", error);
      Alert.alert('Error', 'No se pudo generar el PDF: ' + error.message);
    }
  };

  return (
    <ExportButton onPress={generatePDF}>
      <Text style={{ color: '#26667F', fontWeight: '800' }}>📄 Exportar Notas a PDF</Text>
    </ExportButton>
  );
};

export default ExportPDF;
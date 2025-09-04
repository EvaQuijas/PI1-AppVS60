import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert,Text } from 'react-native';
import styled from 'styled-components/native';

const ExportButton = styled.TouchableOpacity`
  background-color: #BBDCE5;
  padding: 8px 12px;
  border-radius: 8px;
  align-items: center;
  margin-left: 10px;
`;

const ExportSinglePDF = ({ note }) => {
  const generatePDF = async () => {
    try {
      if (!note) {
        Alert.alert('Error', 'No hay nota para compartir');
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${note.title || 'Mi Nota'}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 25px; }
              h1 { color: #26667F; text-align: center; margin-bottom: 20px; }
              .note-content { 
                color: #2c3e50; 
                font-size: 16px; 
                line-height: 1.6;
                white-space: pre-wrap;
                margin-bottom: 20px;
              }
              .note-date { 
                color: #95a5a6; 
                font-size: 14px; 
                text-align: right; 
                border-top: 1px solid #ddd;
                padding-top: 10px;
              }
              .container { 
                max-width: 800px; 
                margin: 0 auto; 
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${note.title || 'Mi Nota'}</h1>
              <div class="note-content">${note.content || 'Sin contenido'}</div>
              <div class="note-date">
                <strong>Creación:</strong> ${note.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}<br>
                ${note.updatedAt ? `<strong>Actualización:</strong> ${note.updatedAt.toDate().toLocaleDateString()}` : ''}
              </div>
            </div>
          </body>
        </html>
      `;

      // Generar el PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Compartir directamente
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Compartir: ${note.title || 'Nota'}`,
        UTI: 'com.adobe.pdf'
      });

    } catch (error) {
      console.error("❌ Error al generar PDF:", error);
      Alert.alert('Error', 'No se pudo compartir la nota: ' + error.message);
    }
  };

  return (
    <ExportButton onPress={generatePDF}>
      <Text style={{ color: '#26667F', fontWeight: '600', fontSize: 12 }}>📄</Text>
    </ExportButton>
  );
};

export default ExportSinglePDF;
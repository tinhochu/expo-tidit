import { Button, ButtonText } from '@/components/ui/button'
import { VStack } from '@/components/ui/vstack'
import { formatFileSize, getCompressionStats, processImage } from '@/lib/imageProcessor'
import * as ImagePicker from 'expo-image-picker'
import React, { useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'

interface ProcessingResult {
  originalSize: number
  processedSize: number
  compressionRatio: number
  sizeReduction: string
  dimensions: string
}

export default function ImageProcessingDemo() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<ProcessingResult | null>(null)

  const pickAndProcessImage = async () => {
    try {
      setIsProcessing(true)

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library.')
        return
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      })

      if (result.canceled || !result.assets[0]) {
        return
      }

      const originalUri = result.assets[0].uri

      // Process with different settings
      const processedImage = await processImage(originalUri, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.8,
        format: 'auto', // Automatically detect and preserve original format
        maintainAspectRatio: true,
      })

      // Get compression stats
      const stats = await getCompressionStats(originalUri, processedImage.uri)

      setResults({
        originalSize: stats.originalSize,
        processedSize: stats.processedSize,
        compressionRatio: stats.compressionRatio,
        sizeReduction: stats.sizeReduction,
        dimensions: `${processedImage.width} × ${processedImage.height}`,
      })
    } catch (error) {
      console.error('Error processing image:', error)
      Alert.alert('Error', 'Failed to process image. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <View style={styles.container}>
      <VStack space="md" style={styles.content}>
        <Text style={styles.title}>Image Processing Demo</Text>
        <Text style={styles.description}>
          This demo shows how images are processed before uploading to reduce file size and improve performance.
        </Text>

        <Button onPress={pickAndProcessImage} disabled={isProcessing} style={styles.button}>
          <ButtonText>{isProcessing ? 'Processing...' : 'Pick & Process Image'}</ButtonText>
        </Button>

        {results && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>Processing Results:</Text>

            <View style={styles.resultRow}>
              <Text style={styles.label}>Original Size:</Text>
              <Text style={styles.value}>{formatFileSize(results.originalSize)}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.label}>Processed Size:</Text>
              <Text style={styles.value}>{formatFileSize(results.processedSize)}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.label}>Size Reduction:</Text>
              <Text style={styles.value}>{results.sizeReduction}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.label}>Compression:</Text>
              <Text style={styles.value}>{results.compressionRatio.toFixed(1)}%</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.label}>Dimensions:</Text>
              <Text style={styles.value}>{results.dimensions}</Text>
            </View>
          </View>
        )}
      </VStack>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 22,
  },
  button: {
    width: '100%',
    maxWidth: 300,
  },
  results: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
})

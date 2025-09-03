import { Button, ButtonText } from '@/components/ui/button'
import { HStack } from '@/components/ui/hstack'
import { Icon } from '@/components/ui/icon'
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Alert } from 'react-native'

interface DeleteAccountModalProps {
  isVisible: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

export default function DeleteAccountModal({ isVisible, onClose, onConfirm, isLoading }: DeleteAccountModalProps) {
  const handleConfirm = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted. Are you absolutely sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: onConfirm,
        },
      ]
    )
  }

  return (
    <Modal isOpen={isVisible} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <HStack space="sm" className="items-center">
            <Ionicons name="warning" size={24} color="#ef4444" />
            <Text className="text-lg font-bold text-gray-900">Delete Account</Text>
          </HStack>
        </ModalHeader>
        <ModalBody>
          <VStack space="md">
            <Text className="text-gray-700">Are you sure you want to delete your account? This action will:</Text>
            <VStack space="sm" className="ml-4">
              <HStack space="sm" className="items-start">
                <Ionicons name="close-circle" size={16} color="#ef4444" />
                <Text className="flex-1 text-gray-600">Permanently delete all your data</Text>
              </HStack>
              <HStack space="sm" className="items-start">
                <Ionicons name="close-circle" size={16} color="#ef4444" />
                <Text className="flex-1 text-gray-600">Cancel any active subscriptions</Text>
              </HStack>
              <HStack space="sm" className="items-start">
                <Ionicons name="close-circle" size={16} color="#ef4444" />
                <Text className="flex-1 text-gray-600">Remove access to all features</Text>
              </HStack>
            </VStack>
            <Text className="mt-2 text-sm text-gray-500">
              This action cannot be undone. Please make sure you have backed up any important data.
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack space="md" className="w-full">
            <Button variant="outline" onPress={onClose} className="flex-1" disabled={isLoading}>
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button action="negative" onPress={handleConfirm} className="flex-1" disabled={isLoading}>
              <ButtonText>{isLoading ? 'Deleting...' : 'Delete Account'}</ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

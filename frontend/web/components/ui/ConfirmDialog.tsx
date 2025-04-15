import React from 'react'
import Button from './button'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-50"></div>
      <div className="relative z-50 w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">{title}</h2>
        <p className="mb-6 text-gray-600">{message}</p>
        <div className="flex justify-end space-x-4">
          <Button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200"
          >
            取消
          </Button>
          <Button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700"
          >
            确认
          </Button>
        </div>
      </div>
    </div>
  )
}

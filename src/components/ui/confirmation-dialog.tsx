"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, AlertTriangle, CheckCircle, Info, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info" | "success"
  icon?: React.ReactNode
}

export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  icon
}: ConfirmationDialogProps) => {
  const [mounted, setMounted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const handleConfirm = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onConfirm()
      onClose()
    }, 150)
  }

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
    }, 150)
  }

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <Trash2 className="h-6 w-6 text-red-500" />,
          button: "bg-red-500 hover:bg-red-600 text-white",
          border: "border-red-200",
          bg: "bg-red-50"
        }
      case "warning":
        return {
          icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
          button: "bg-yellow-500 hover:bg-yellow-600 text-white",
          border: "border-yellow-200",
          bg: "bg-yellow-50"
        }
      case "info":
        return {
          icon: <Info className="h-6 w-6 text-blue-500" />,
          button: "bg-blue-500 hover:bg-blue-600 text-white",
          border: "border-blue-200",
          bg: "bg-blue-50"
        }
      case "success":
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-500" />,
          button: "bg-green-500 hover:bg-green-600 text-white",
          border: "border-green-200",
          bg: "bg-green-50"
        }
      default:
        return {
          icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
          button: "bg-red-500 hover:bg-red-600 text-white",
          border: "border-red-200",
          bg: "bg-red-50"
        }
    }
  }

  const variantStyles = getVariantStyles()

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div 
        className={cn(
          "relative w-full max-w-md transform rounded-2xl bg-white shadow-2xl transition-all duration-200",
          "border border-gray-200",
          isAnimating 
            ? "scale-100 opacity-100" 
            : "scale-95 opacity-0"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-6 border-b",
          variantStyles.border
        )}>
          <div className="flex items-center space-x-3">
            {icon || variantStyles.icon}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              variantStyles.button
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
} 
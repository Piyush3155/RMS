import { useCallback } from "react"

type ToastOptions = {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    // Simple fallback: use alert for demonstration
    alert(`${options.title}${options.description ? ": " + options.description : ""}`)
    // Replace with your toast library logic if available
  }, [])

  return { toast }
}
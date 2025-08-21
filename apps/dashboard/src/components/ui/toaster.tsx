import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  const handleToastClick = (toastId: string, event: React.MouseEvent) => {
    // Prevent dismissing if clicking on action buttons or close button
    if (
      (event.target as HTMLElement).closest('[toast-close]') ||
      (event.target as HTMLElement).closest('button')
    ) {
      return
    }
    
    dismiss(toastId)
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props}
            className="cursor-pointer transition-opacity hover:opacity-80"
            onClick={(event) => handleToastClick(id, event)}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

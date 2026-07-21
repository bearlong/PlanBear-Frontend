import { toast } from 'react-hot-toast'

export const useToast = () => {
  const success = (message) => {
    toast.success(message, {
      style: {
        border: '1px solid #4BB543',
        padding: '16px',
        fontSize: '16px',
      },
    })
  }

  const error = (message) => {
    toast.error(message, {
      style: {
        border: '1px solid #FF3333',
        padding: '16px',
        fontSize: '16px',
      },
    })
  }

  return { success, error }
}

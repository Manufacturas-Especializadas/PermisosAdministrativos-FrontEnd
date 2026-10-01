import { useMutation } from '@tanstack/react-query'
import { createPersonalPermit } from '../../../api/personalPermitsApi'

export function useCreatePersonalPermit() {
    return useMutation({
        mutationFn: createPersonalPermit,
    })
}

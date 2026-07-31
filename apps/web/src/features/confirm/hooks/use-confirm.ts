import { confirm } from "../stores/confirm-store";

/**
 * React 컴포넌트 내부에서 관용적으로 사용하기 위한 커스텀 훅
 */
export const useConfirm = () => confirm;

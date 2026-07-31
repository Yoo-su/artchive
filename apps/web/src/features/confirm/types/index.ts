import React from "react";

export interface ConfirmOptions {
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export interface ConfirmRequest {
  id: string;
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

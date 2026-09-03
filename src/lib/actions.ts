import { ActionSheetIOS, Alert, Platform } from 'react-native';

export type ActionOption = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

/** Native action sheet on iOS, an alert with buttons elsewhere. */
export function showActions({
  title,
  message,
  options,
  cancelLabel = 'Cancel',
}: {
  title?: string;
  message?: string;
  options: ActionOption[];
  cancelLabel?: string;
}) {
  if (Platform.OS === 'ios') {
    const destructiveButtonIndex = options.findIndex((option) => option.destructive);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: [...options.map((option) => option.label), cancelLabel],
        cancelButtonIndex: options.length,
        destructiveButtonIndex: destructiveButtonIndex >= 0 ? destructiveButtonIndex : undefined,
      },
      (index) => {
        options[index]?.onPress();
      },
    );
    return;
  }
  Alert.alert(title ?? '', message, [
    ...options.map((option) => ({
      text: option.label,
      onPress: option.onPress,
      style: option.destructive ? ('destructive' as const) : ('default' as const),
    })),
    { text: cancelLabel, style: 'cancel' },
  ]);
}

export function confirmDestructive({
  title,
  message,
  confirmLabel,
  onConfirm,
}: {
  title: string;
  message?: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

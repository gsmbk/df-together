import { Children, isValidElement, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, hairline, radii, spacing, text } from '../theme';
import { Icon } from './Icon';
import { icons } from './icons';

/**
 * Inset grouped list primitives modelled on UITableView's inset-grouped style:
 * an uppercase header, a rounded card holding rows separated by hairlines, and
 * an optional footnote footer.
 */
export function GroupedSection({
  header,
  footer,
  children,
  style,
  separatorInset = spacing.lg,
}: {
  header?: string;
  footer?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  separatorInset?: number;
}) {
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={[styles.section, style]}>
      {header ? <Text style={styles.header}>{header}</Text> : null}
      <View style={styles.card}>
        {rows.map((row, index) => (
          <View key={row.key ?? index}>
            {row}
            {index < rows.length - 1 ? (
              <View style={[styles.separator, { marginLeft: separatorInset }]} />
            ) : null}
          </View>
        ))}
      </View>
      {footer ? (
        typeof footer === 'string' ? (
          <Text style={styles.footer}>{footer}</Text>
        ) : (
          <View style={styles.footerView}>{footer}</View>
        )
      ) : null}
    </View>
  );
}

type RowProps = {
  title: string;
  subtitle?: string;
  detail?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  accessory?: 'chevron' | 'checkmark' | 'none';
  checked?: boolean;
  onPress?: () => void;
  destructive?: boolean;
  tinted?: boolean;
  disabled?: boolean;
  titleStyle?: StyleProp<TextStyle>;
  titleLines?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function Row({
  title,
  subtitle,
  detail,
  leading,
  trailing,
  accessory = 'none',
  checked,
  onPress,
  destructive,
  tinted,
  disabled,
  titleStyle,
  titleLines,
  accessibilityLabel,
  accessibilityHint,
}: RowProps) {
  const color = destructive ? colors.red : tinted ? colors.tint : colors.label;
  const content = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.rowCopy}>
        <Text numberOfLines={titleLines} style={[text.body, { color }, titleStyle]}>
          {title}
        </Text>
        {subtitle ? <Text style={text.footnoteSecondary}>{subtitle}</Text> : null}
      </View>
      {detail ? (
        <Text numberOfLines={1} style={[text.bodySecondary, styles.detail]}>
          {detail}
        </Text>
      ) : null}
      {trailing}
      {accessory === 'chevron' ? (
        <Icon {...icons.chevron} color={colors.tertiaryLabel} size={14} weight="semibold" />
      ) : null}
      {accessory === 'checkmark' ? (
        <View style={styles.check}>
          {checked ? <Icon {...icons.checkmark} color={colors.tint} size={16} weight="semibold" /> : null}
        </View>
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled, checked: accessory === 'checkmark' ? Boolean(checked) : undefined }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, disabled && styles.disabled]}
    >
      {content}
    </Pressable>
  );
}

/** Free-form content inside a grouped card, with standard cell padding. */
export function Cell({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.cell, style]}>{children}</View>;
}

export const groupedStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
});

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  header: { ...text.sectionHeader, paddingHorizontal: spacing.lg },
  card: groupedStyles.card,
  separator: { height: hairline, backgroundColor: colors.separator },
  footer: { ...text.footnoteSecondary, paddingHorizontal: spacing.lg },
  footerView: { paddingHorizontal: spacing.lg },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
  },
  pressed: { backgroundColor: colors.quaternaryFill },
  disabled: { opacity: 0.5 },
  leading: { width: 28, alignItems: 'center' },
  rowCopy: { flex: 1, gap: 2 },
  detail: { flexShrink: 1, maxWidth: '50%' },
  check: { width: 20, alignItems: 'flex-end' },
  cell: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
});

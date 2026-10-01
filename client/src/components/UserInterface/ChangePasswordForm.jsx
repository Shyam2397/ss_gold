import React, { useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiKey,
  FiLoader,
  FiLock,
  FiSave,
  FiShield,
} from 'react-icons/fi';
import { cn } from '../../lib/utils';
import { PASSWORD_RULES, getPasswordStrength, isPasswordValid } from './passwordRules';

const PasswordInput = ({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  hint,
  onToggleVisibility,
  isVisible,
  disabled,
}) => (
  <div>
    <label htmlFor={id} className="flex items-center text-sm font-medium text-amber-900 mb-1.5">
      {Icon && <Icon className="w-4 h-4 mr-1.5 text-amber-600" />}
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type={isVisible ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full py-1.5 pl-8 pr-9 rounded-lg border bg-white text-amber-900 outline-none transition-all text-sm',
          'placeholder:text-amber-400 focus:ring-2 focus:ring-amber-400 disabled:bg-amber-50 disabled:text-amber-500',
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-300'
            : 'border-amber-200 focus:border-amber-400'
        )}
      />
      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
        <Icon className="h-4 w-4 text-amber-600" />
      </div>
      <button
        type="button"
        onClick={onToggleVisibility}
        disabled={disabled}
        aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
        className="absolute inset-y-0 right-0 px-2 flex items-center text-amber-500 transition-colors hover:text-amber-700 disabled:opacity-50"
      >
        {isVisible ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
      </button>
    </div>
    {error ? (
      <p className="text-xs text-red-600 mt-1 flex items-center">
        <FiAlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
        {error}
      </p>
    ) : (
      hint && <p className="text-xs text-amber-600 mt-1">{hint}</p>
    )}
  </div>
);

const StrengthMeter = ({ value }) => {
  const strength = useMemo(() => getPasswordStrength(value), [value]);

  if (!value) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              bar <= strength.bars ? strength.barClass : 'bg-amber-100'
            )}
          />
        ))}
        <span className={cn('ml-1 text-xs font-medium', strength.textClass)}>{strength.label}</span>
      </div>
    </div>
  );
};

const RuleChecklist = ({ value }) => (
  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 mt-2">
    {PASSWORD_RULES.map((rule) => {
      const satisfied = rule.test(value || '');
      return (
        <li
          key={rule.id}
          className={cn(
            'flex items-center text-xs transition-colors',
            satisfied ? 'text-emerald-600' : 'text-amber-500'
          )}
        >
          {satisfied ? (
            <FiCheckCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
          ) : (
            <span className="h-3.5 w-3.5 mr-1 flex-shrink-0 rounded-full border border-amber-300" />
          )}
          {rule.label}
        </li>
      );
    })}
  </ul>
);

const ChangePasswordForm = ({
  onSubmit,
  status = 'idle',
  error: serverError,
  successMessage,
  requireCurrentPassword = true,
  onCancel,
  isLocked = false,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [touched, setTouched] = useState({ current: false, next: false, confirm: false });

  const isSaving = status === 'saving';

  const errors = useMemo(() => {
    const next = { current: '', new: '', confirm: '' };

    if (requireCurrentPassword && touched.current && !currentPassword) {
      next.current = 'Enter your current password';
    }

    if (touched.next) {
      if (!newPassword) {
        next.new = 'Enter a new password';
      } else if (!isPasswordValid(newPassword)) {
        next.new = 'Password does not meet all the requirements';
      } else if (requireCurrentPassword && currentPassword && newPassword === currentPassword) {
        next.new = 'New password must be different from the current password';
      }
    }

    if (touched.confirm) {
      if (!confirmPassword) {
        next.confirm = 'Re-enter the new password';
      } else if (confirmPassword !== newPassword) {
        next.confirm = 'Passwords do not match';
      }
    }

    return next;
  }, [currentPassword, newPassword, confirmPassword, touched, requireCurrentPassword]);

  const canSubmit =
    (!requireCurrentPassword || Boolean(currentPassword)) &&
    isPasswordValid(newPassword) &&
    newPassword === confirmPassword &&
    (!requireCurrentPassword || !currentPassword || newPassword !== currentPassword);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ current: true, next: true, confirm: true });

    if (!canSubmit || isSaving) return;

    await onSubmit({
      currentPassword: requireCurrentPassword ? currentPassword : '',
      newPassword,
      confirmPassword,
    });

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTouched({ current: false, next: false, confirm: false });
    setVisible({ current: false, next: false, confirm: false });
  };

  const toggle = (field) => setVisible((prev) => ({ ...prev, [field]: !prev[field] }));
  const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      {requireCurrentPassword && (
        <PasswordInput
          id="current-password"
          label="Current password"
          icon={FiLock}
          value={currentPassword}
          onChange={(v) => {
            setCurrentPassword(v);
            if (touched.next) markTouched('next');
          }}
          onBlur={() => markTouched('current')}
          placeholder="Enter current password"
          autoComplete="current-password"
          error={errors.current}
          isVisible={visible.current}
          onToggleVisibility={() => toggle('current')}
          disabled={isSaving || isLocked}
        />
      )}

      <div>
        <PasswordInput
          id="new-password"
          label="New password"
          icon={FiKey}
          value={newPassword}
          onChange={(v) => {
            setNewPassword(v);
            if (touched.confirm) markTouched('confirm');
          }}
          onBlur={() => markTouched('next')}
          placeholder="Enter new password"
          autoComplete="new-password"
          error={errors.new}
          isVisible={visible.next}
          onToggleVisibility={() => toggle('next')}
          disabled={isSaving || isLocked}
        />
        <StrengthMeter value={newPassword} />
        <RuleChecklist value={newPassword} />
      </div>

      <PasswordInput
        id="confirm-password"
        label="Confirm new password"
        icon={FiShield}
        value={confirmPassword}
        onChange={setConfirmPassword}
        onBlur={() => markTouched('confirm')}
        placeholder="Re-enter new password"
        autoComplete="new-password"
        error={errors.confirm}
        hint={!errors.confirm && confirmPassword && confirmPassword === newPassword ? 'Passwords match' : undefined}
        isVisible={visible.confirm}
        onToggleVisibility={() => toggle('confirm')}
        disabled={isSaving || isLocked}
      />

      {serverError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <FiAlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <FiCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
          <p className="text-sm text-emerald-700">{successMessage}</p>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={!canSubmit || isSaving || isLocked}
          className="flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <FiLoader className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <FiSave className="mr-2 h-4 w-4" />
              Update password
            </>
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-xl border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ChangePasswordForm;
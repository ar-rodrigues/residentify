"use client";

import { useEffect, useRef, useCallback } from "react";
import { DatePicker as AntDatePicker } from "antd";
import dayjs from "dayjs";
import { RiCalendarLine } from "react-icons/ri";

/**
 * Reusable DatePicker component with auto-formatting (DD/MM/YYYY) and future date disabling
 * @param {Object} props - DatePicker props
 * @param {boolean} props.disabledFutureDates - Whether to disable future dates (default: true)
 * @param {string} props.format - Date format (default: "DD/MM/YYYY")
 * @param {string} props.placeholder - Placeholder text (default: "DD/MM/YYYY")
 * @param {string} props.size - Size of the input (default: "large")
 * @param {dayjs.Dayjs} props.value - Controlled value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onFormFieldChange - Optional callback to update form field value (for auto-formatting)
 * @param {Object} props.rest - Additional Ant Design DatePicker props
 */
export default function DatePicker({
  disabledFutureDates = true,
  format = "DD/MM/YYYY",
  placeholder = "DD/MM/YYYY",
  size = "large",
  value,
  onChange,
  onFormFieldChange,
  className = "",
  ...rest
}) {
  const datePickerRef = useRef(null);

  // Disable future dates
  const disabledDate = useCallback(
    (current) => {
      if (!disabledFutureDates) return false;
      if (!current) return false;
      return current && current.isAfter(dayjs(), "day");
    },
    [disabledFutureDates]
  );

  // Format date input as user types (dd/mm/yyyy)
  const formatDateInput = useCallback((value) => {
    if (!value) return "";

    const digits = value.replace(/\D/g, "");
    const limitedDigits = digits.slice(0, 8);

    let formatted = limitedDigits;
    if (limitedDigits.length > 2) {
      formatted = `${limitedDigits.slice(0, 2)}/${limitedDigits.slice(2)}`;
    }
    if (limitedDigits.length > 4) {
      formatted = `${limitedDigits.slice(0, 2)}/${limitedDigits.slice(
        2,
        4
      )}/${limitedDigits.slice(4)}`;
    }

    return formatted;
  }, []);

  // Handle date input change with auto-formatting
  const handleDateInputChange = useCallback(
    (e) => {
      const inputValue = e.target.value;
      const formatted = formatDateInput(inputValue);

      if (inputValue !== formatted) {
        const cursorPos = e.target.selectionStart || 0;

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(e.target, formatted);
        }

        let newCursorPos = formatted.length;
        if (cursorPos <= 2 && formatted.length > 2) {
          newCursorPos = Math.min(cursorPos, 2);
        } else if (cursorPos <= 5 && formatted.length > 5) {
          newCursorPos = Math.min(cursorPos + 1, 5);
        } else {
          newCursorPos = formatted.length;
        }

        const inputEvent = new Event("input", {
          bubbles: true,
          cancelable: true,
        });
        e.target.dispatchEvent(inputEvent);

        setTimeout(() => {
          const input = e.target;
          if (input) {
            input.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      } else {
        setTimeout(() => {
          const input = e.target;
          if (input) {
            input.setSelectionRange(formatted.length, formatted.length);
          }
        }, 0);
      }

      // If we have a complete date and onFormFieldChange callback, update the form field
      if (formatted.length === 10 && onFormFieldChange) {
        const [day, month, year] = formatted.split("/").map(Number);
        if (day && month && year && day <= 31 && month <= 12) {
          const date = dayjs(
            `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
              2,
              "0"
            )}`
          );
          if (
            date.isValid() &&
            (!disabledFutureDates || !date.isAfter(dayjs(), "day"))
          ) {
            setTimeout(() => {
              onFormFieldChange(date);
            }, 10);
          }
        }
      }
    },
    [formatDateInput, onFormFieldChange, disabledFutureDates]
  );

  // Set up input event listener for date formatting
  useEffect(() => {
    let cleanup = null;
    let observer = null;

    const attachListener = () => {
      const datePickerInput =
        datePickerRef.current?.querySelector("input") ||
        datePickerRef.current?.querySelector(".ant-picker-input input") ||
        datePickerRef.current?.querySelector("input.ant-picker-input");

      if (datePickerInput && !datePickerInput.dataset.listenerAttached) {
        const handleInput = (e) => {
          handleDateInputChange(e);
        };

        const handleBeforeInput = (e) => {
          if (e.data && /^\d$/.test(e.data)) {
            const currentValue = e.target.value || "";
            const newValue = currentValue + e.data;
            const formatted = formatDateInput(newValue);

            if (formatted !== newValue) {
              e.preventDefault();

              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value"
              )?.set;
              if (nativeInputValueSetter) {
                nativeInputValueSetter.call(e.target, formatted);
              }

              const inputEvent = new Event("input", { bubbles: true });
              e.target.dispatchEvent(inputEvent);

              setTimeout(() => {
                e.target.setSelectionRange(formatted.length, formatted.length);
              }, 0);

              if (formatted.length === 10 && onFormFieldChange) {
                const [day, month, year] = formatted.split("/").map(Number);
                if (day && month && year && day <= 31 && month <= 12) {
                  const date = dayjs(
                    `${year}-${String(month).padStart(2, "0")}-${String(
                      day
                    ).padStart(2, "0")}`
                  );
                  if (
                    date.isValid() &&
                    (!disabledFutureDates || !date.isAfter(dayjs(), "day"))
                  ) {
                    setTimeout(() => {
                      onFormFieldChange(date);
                    }, 10);
                  }
                }
              }
            }
          }
        };

        datePickerInput.addEventListener("input", handleInput);
        datePickerInput.addEventListener("beforeinput", handleBeforeInput);
        datePickerInput.dataset.listenerAttached = "true";

        cleanup = () => {
          datePickerInput.removeEventListener("input", handleInput);
          datePickerInput.removeEventListener("beforeinput", handleBeforeInput);
          delete datePickerInput.dataset.listenerAttached;
        };
        return true;
      }
      return false;
    };

    if (!attachListener()) {
      let lastCheck = 0;
      const DEBOUNCE_MS = 50;

      observer = new MutationObserver(() => {
        const now = Date.now();
        if (now - lastCheck > DEBOUNCE_MS) {
          lastCheck = now;
          if (attachListener()) {
            observer.disconnect();
          }
        }
      });

      if (datePickerRef.current) {
        observer.observe(datePickerRef.current, {
          childList: true,
          subtree: true,
          attributes: false,
        });
      }

      const timeoutIds = [100, 300, 500, 1000].map((delay) =>
        setTimeout(() => attachListener(), delay)
      );

      return () => {
        timeoutIds.forEach(clearTimeout);
        if (observer) observer.disconnect();
        if (cleanup) cleanup();
      };
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [
    handleDateInputChange,
    formatDateInput,
    onFormFieldChange,
    disabledFutureDates,
  ]);

  return (
    <div ref={datePickerRef}>
      <AntDatePicker
        placeholder={placeholder}
        format={format}
        disabledDate={disabledDate}
        className={`w-full ${className}`}
        size={size}
        style={{ width: "100%" }}
        suffixIcon={<RiCalendarLine className="text-gray-400" />}
        inputReadOnly={false}
        value={value}
        onChange={onChange}
        {...rest}
      />
    </div>
  );
}






























import { useState } from "react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import useUIVariants from "../adaptation/useUIVariants.jsx";

/**
 * PasswordInput: Adaptive password field with visibility toggle
 * 
 * Features:
 * - Eye icon toggle for visibility with no layout shift
 * - Material-UI IconButton with accessible label
 * - Maintains controlled input state via parent
 * - Responsive font sizing via useUIVariants
 * 
 * Props:
 *  - value: string (controlled state)
 *  - onChange: function (e) => void
 *  - placeholder: string (optional)
 *  - onFocus: function (optional) - for metrics collection
 *  - onBlur: function (optional)
 *  - disabled: boolean (optional)
 *  - error: boolean (optional) - for error styling
 *  - helperText: string (optional) - error message
 *  - fullWidth: boolean (optional, default true)
 */
export default function PasswordInput({
  value,
  onChange,
  placeholder = "Password",
  onFocus,
  onBlur,
  disabled = false,
  error = false,
  helperText = "",
  fullWidth = true,
  ...restProps
}) {
  const [showPassword, setShowPassword] = useState(false);
  const ui = useUIVariants();

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleMouseDownPassword = (e) => {
    // Prevent default to avoid input losing focus
    e.preventDefault();
  };

  return (
    <TextField
      type={showPassword ? "text" : "password"}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
      error={error}
      helperText={helperText}
      fullWidth={fullWidth}
      variant="outlined"
      size="medium"
      className={`${ui.text}`}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
              edge="end"
              disabled={disabled}
              tabIndex={-1}
              sx={{
                marginRight: "-8px", // Adjust padding to prevent layout shift
              }}
            >
              {showPassword ? (
                <VisibilityOff fontSize="small" />
              ) : (
                <Visibility fontSize="small" />
              )}
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={{
        marginBottom: "12px",
        "& .MuiOutlinedInput-root": {
          fontSize: ui.text.includes("sm") ? "0.875rem" : "1rem",
          transition: "all 0.2s ease", // Smooth transitions
        },
        "& .MuiOutlinedInput-input": {
          padding: "12px 14px",
        },
      }}
      {...restProps}
    />
  );
}

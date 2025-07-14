import React from 'react';
import { TextField, InputAdornment, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { Visibility, VisibilityOff } from '@material-ui/icons';
import { touchTargets } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  textField: {
    ...touchTargets.input(theme),
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: theme.palette.divider
      },
      '&:hover fieldset': {
        borderColor: theme.palette.primary.main
      }
    }
  },
  helperText: {
    marginTop: theme.spacing(0.5)
  }
}));

const FormField = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  type = 'text',
  variant = 'outlined',
  size = 'medium',
  fullWidth = true,
  required = false,
  disabled = false,
  autoComplete,
  autoFocus = false,
  multiline = false,
  rows = 1,
  maxRows,
  placeholder,
  InputProps = {},
  inputProps = {},
  startAdornment,
  endAdornment,
  showPasswordToggle = false,
  className,
  ...textFieldProps
}) => {
  const classes = useStyles();
  const [showPassword, setShowPassword] = React.useState(false);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const getType = () => {
    if (type === 'password' && showPasswordToggle) {
      return showPassword ? 'text' : 'password';
    }
    return type;
  };

  const getEndAdornment = () => {
    if (type === 'password' && showPasswordToggle) {
      return (
        <InputAdornment position="end">
          <IconButton
            onClick={handleTogglePassword}
            edge="end"
            size="small"
            tabIndex={-1}
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </InputAdornment>
      );
    }
    return endAdornment;
  };

  const mergedInputProps = {
    ...InputProps,
    startAdornment: startAdornment && (
      <InputAdornment position="start">{startAdornment}</InputAdornment>
    ),
    endAdornment: getEndAdornment()
  };

  return (
    <TextField
      name={name}
      label={label}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={!!error}
      helperText={error || helperText}
      type={getType()}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      required={required}
      disabled={disabled}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      multiline={multiline}
      rows={rows}
      maxRows={maxRows}
      placeholder={placeholder}
      className={`${classes.textField} ${className || ''}`}
      InputProps={mergedInputProps}
      inputProps={inputProps}
      FormHelperTextProps={{
        className: classes.helperText
      }}
      {...textFieldProps}
    />
  );
};

export default FormField;
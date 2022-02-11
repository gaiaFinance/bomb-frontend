//Your theme for the new stuff using material UI has been copied here so it doesn't conflict
import { createTheme } from '@material-ui/core/styles';

const newTheme = createTheme({
  palette: {
    type: 'light',
    text: {
      primary: '#dddfee',
      secondary: 'white',
      yellow: '#F9D606',
    },
    background: {
      default: '#fff',
      paper: '#000',
    },
    primary: {
      light: '#ffe066',
      main: '#fff',
      dark: '#333',
      contrastText: '#000',
    },
    secondary: {
      light: '#ff7961',
      main: '#f44336',
      dark: '#ba000d',
      contrastText: '#000',
    },
    action: {
      disabledBackground: '#CDCDCD',
      active: '#000',
      hover: '#fff',
    },
  },
  typography: {
    color: '#2c2560',
    fontFamily: ['"Rubik"', 'sans-serif'].join(','),
  },
});

export default newTheme;

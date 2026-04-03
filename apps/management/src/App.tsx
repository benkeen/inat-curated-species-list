import { Route, Routes, BrowserRouter } from 'react-router';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Header } from './components/header/Header';
import { Navigation } from './components/navigation/Navigation';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import * as mainActions from './store/main/main.actions';
import * as mainSelectors from './store/main/main.selectors';
import * as C from './constants';
import { createTheme, ThemeProvider } from '@mui/material';
import { BaselineSpecies } from './components/baseline/BaselineSpecies';
import { FileSettings } from './components/settings/FileSettings';
import { MainSettingsPage } from './components/settings/MainSettings';
import { PublishSettings } from './components/settings/PublishSettings';
import { CuratedChecklist } from './components/checklist/CuratedChecklist';
import store, { persistor } from './store';

const checkState = async (store: any) => {
  const lastAppStateVersion = mainSelectors.getAppStateVersion(store.getState());
  if (lastAppStateVersion !== C.APP_STATE_VERSION) {
    await store.dispatch(mainActions.purgeState());
  }
};

function App() {
  const theme = createTheme({
    typography: {
      fontFamily: 'georgia',
    },
    palette: {
      primary: {
        main: '#1d64a8',
      },
    },
    components: {
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true,
        },
      },
    },
  });

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor} onBeforeLift={() => checkState(store)}>
        <ThemeProvider theme={theme}>
          <Header />
          <BrowserRouter>
            <Container maxWidth="lg" style={{ height: '100%' }}>
              <Grid container spacing={3} paddingTop={10} height="100%">
                <Grid size={3}>
                  <Navigation />
                </Grid>
                <Grid size="grow" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
                  <Routes>
                    <Route index path="/" element={<div>(router - login or redirect to curated checklist page)</div>} />
                    <Route path="curated-checklist" element={<CuratedChecklist />} />
                    <Route path="baseline-species" element={<BaselineSpecies />} />
                    <Route path="settings/main" element={<MainSettingsPage />} />
                    <Route path="settings/files" element={<FileSettings />} />
                    <Route path="settings/publish" element={<PublishSettings />} />
                  </Routes>
                </Grid>
              </Grid>
            </Container>
          </BrowserRouter>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

// <Link component={RouterLink} to="/home">home </Link>

export default App;

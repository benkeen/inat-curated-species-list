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
import { UpdateInatData } from './components/update-inat-data/UpdateInatData';
import { FileSettings } from './components/settings/FileSettings';
import { MainSettingsPage } from './components/settings/MainSettings';
import { PublishSettings } from './components/settings/PublishSettings';
import { Checklist } from './components/checklist/Checklist';
import { NewAdditionsPage } from './components/new-additions/NewAdditionsPage';
import { UnconfirmedSpecies } from './components/unconfirmed-species/UnconfirmedSpecies';
import { TaxonChangesPage } from './components/taxon-changes/TaxonChangesPage';
import { CuratedSpecies } from './components/curated-species/CuratedSpecies';
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
      fontFamily: 'Trebuchet MS',
    },
    palette: {
      primary: {
        main: '#1d64a8',
      },
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
      },
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
          <BrowserRouter>
            <Header />
            <Container maxWidth="lg" style={{ height: '100%' }}>
              <Grid container spacing={3} paddingTop={10} height="100%">
                <Grid size={3}>
                  <Navigation />
                </Grid>
                <Grid size="grow" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
                  <Routes>
                    <Route index path="/" element={<div>(router - login or redirect to curated checklist page)</div>} />
                    <Route path="baseline-species" element={<BaselineSpecies />} />
                    <Route path="update-inat-data" element={<UpdateInatData />} />
                    <Route path="curated-species" element={<CuratedSpecies />} />
                    <Route path="new-additions" element={<NewAdditionsPage />} />
                    <Route path="unconfirmed-species" element={<UnconfirmedSpecies />} />
                    <Route path="taxon-changes" element={<TaxonChangesPage />} />
                    <Route path="settings/main" element={<MainSettingsPage />} />
                    <Route path="settings/files" element={<FileSettings />} />
                    <Route path="settings/publish" element={<PublishSettings />} />
                    <Route path="curated-checklist" element={<Checklist />} />
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

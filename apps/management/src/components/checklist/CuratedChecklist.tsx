import { useRef } from 'react';
import Box from '@mui/material/Box';
import { Logger } from './Logger';
import { LoggerHandle } from './types';

export const CuratedChecklist = () => {
  //   const [curatorUsernames, setCuratorUsernames] = useState(() => C.DEMO_DEFAULT_CURATOR_INAT_USERNAMES.join(','));
  //   const [placeId, setPlaceId] = useState<number | ''>(C.DEMO_DEFAULT_PLACE_ID);
  //   const [taxonId, setTaxonId] = useState<number | ''>(C.DEMO_DEFAULT_TAXON_ID);
  //   const [loading, setLoading] = useState(false);
  //   const [dataLoaded, setDataLoaded] = useState(false);
  //   const [curatedSpeciesData, setCuratedSpeciesData] = useState<CuratedSpeciesData | null>(null);
  //   //   const [newAdditionsData, setNewAdditionsData] = useState(null);
  //   const [tabIndex, setTabIndex] = useState(0);
  const loggerRef = useRef<LoggerHandle>(null);

  //   const onChangeTab = (_e: React.SyntheticEvent, newValue: number) => {
  //     setTabIndex(newValue);
  //   };

  //   const downloadData = () => {
  //     if (!loggerRef || !placeId || !taxonId) {
  //       return;
  //     }

  //     // clear out any old data and start the new requests
  //     // resetData();
  //     setLoading(true);

  //     loggerRef.current!.clear();
  //     loggerRef.current!.addLogRow('Pinging iNat for observation data.', 'info');

  //     const onSuccess = (
  //       curatedSpeciesData: any, // newAdditionsData
  //     ) => {
  //       setLoading(false);
  //       setDataLoaded(true);

  //       console.log('on success [all]', curatedSpeciesData);

  //       loggerRef.current!.addLogRows([
  //         ['Observation data all returned.', 'info'],
  //         ['Parsing data.', 'info'],
  //         [`Found <b>${Object.keys(curatedSpeciesData).length}</b> unique species in observation results.`, 'success'],
  //       ]);

  //       setCuratedSpeciesData(curatedSpeciesData);
  //       // setNewAdditionsData(minifyNewAdditionsData(newAdditionsData, C.NEW_ADDITIONS_IGNORE_SPECIES_OBSERVED_BY));
  //     };

  //     const onError = () => {
  //       loggerRef.current!.addLogRow('Error pinging the iNat API.', 'error');
  //       setLoading(false);
  //     };

  //     downloadDataByPacket({
  //       curators: curatorUsernames,
  //       placeId,
  //       taxonId,
  //       visibleTaxons: C.VISIBLE_TAXONS, // TODO allow option via UI to configure?
  //       maxResults: 1000,
  //       packetNum: 1,
  //       logger: loggerRef,
  //       logFormat: 'html',
  //       onSuccess,
  //       onError,
  //     });

  //     // const d = require('./test-data.json');
  //     // setNewAdditionsData(minifyNewAdditionsData(d));
  //   };
  // return <DataTable data={curatedSpeciesData} curatorUsernames={curatorUsernames} placeId={placeId} />;

  // style={{ display: 'flex', visibility: true, height: 100 }}
  return (
    <Box>
      <Logger ref={loggerRef} />
    </Box>
  );

  return null;
};

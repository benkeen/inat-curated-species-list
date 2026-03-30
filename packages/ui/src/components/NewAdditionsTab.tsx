import { FC, useEffect, useState } from 'react';
import { Loader } from './Loader';
import { constants } from '@ecophilia/inat-curated-species-list-common';
import { YearNavigation } from './YearNavigation';
import { getNewAdditionDataForUI, formatDate } from '../utils/helpers';
import { NewAddition } from '@ecophilia/inat-curated-species-list-tools';
import { NewAdditionsByYear } from '../ui.types';
import { ViewIcon } from './ViewIcon';

const { INAT_OBSERVATIONS_URL } = constants;

export interface NewAdditionsTabProps {
  readonly dataUrl: string;
  readonly showRowNumbers: boolean;
  readonly tabText?: any;
}

export const NewAdditionsTab: FC<NewAdditionsTabProps> = ({ dataUrl, tabText, showRowNumbers }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState<NewAdditionsByYear>();
  const [years, setYears] = useState<string[]>([]);
  const [currentYear, setCurrentYear] = useState<string>();

  const onChangeYear = (year: string) => setCurrentYear(year);

  useEffect(() => {
    fetch(dataUrl, {
      headers: {
        Accept: 'application/json',
      },
    })
      .then((resp) => resp.json())
      .then((data) => {
        const { currentYear, years, groupedByYear } = getNewAdditionDataForUI(data);
        setCurrentYear(currentYear);
        setYears(years);
        setData(groupedByYear);
        setLoaded(true);
      })
      .catch(() => setError(true));
  }, [dataUrl]);

  if (error) {
    return <p>Sorry, there was an error loading the data.</p>;
  }

  if (!loaded || !data || !currentYear) {
    return (
      <div className="icsl-loader">
        <Loader />
      </div>
    );
  }

  const newYearRecords = data[currentYear];

  let dataContent = <p className="icsl-empty-tab icsl-new-additions-none">There are no new records for this year</p>;

  if (newYearRecords) {
    dataContent = (
      <table className="icsl-table" cellSpacing={0} cellPadding={2}>
        <thead>
          <tr>
            {showRowNumbers && <th></th>}
            <th>Species</th>
            <th>Observer</th>
            <th>Date observed</th>
            <th>Date confirmed</th>
            <th>Curator</th>
            <th style={{ width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {(newYearRecords as unknown as NewAddition[]).map(
            ({ speciesName, taxonId, observationId, curator, dateObserved, confirmationDate, observer }, index) => {
              const rowNum = newYearRecords.length - index;
              return (
                <tr key={taxonId}>
                  {showRowNumbers && (
                    <th>
                      <b>{rowNum}</b>
                    </th>
                  )}
                  <td>
                    <a
                      href={`${INAT_OBSERVATIONS_URL}/${observationId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="icsl-species-name"
                    >
                      {speciesName}
                    </a>
                  </td>
                  <td>{observer.username}</td>
                  <td>{formatDate(dateObserved)}</td>
                  <td>{formatDate(confirmationDate)}</td>
                  <td>{curator}</td>
                  <td>
                    <a
                      href={`${INAT_OBSERVATIONS_URL}/${observationId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="icsl-view-link"
                    >
                      <ViewIcon />
                    </a>
                  </td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    );
  }

  const tabTextHtml = tabText ? <div className="icsl-tab-text" dangerouslySetInnerHTML={{ __html: tabText }} /> : null;

  return (
    <>
      {tabTextHtml}
      <YearNavigation years={years} onChange={onChangeYear} currentYear={currentYear} />
      {dataContent}
    </>
  );
};

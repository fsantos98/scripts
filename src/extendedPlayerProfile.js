import InADayParser from './libs/InADayParser';
import requestCreator from './libs/requestCreator';
import getTranslations from './i18n/extendedPlayerProfile';
import renderTodaysStats from './common/renderTodaysStats';
import showPopup from './utils/showPopup';
import showEnnoblementsPopup from './common/showEnnoblementsPopup';
import showHistoryPopup from './common/showHistoryPopup';
import {
  generatePaginationItems,
  getContainerStyles,
  setPage,
  getPage,
} from './utils/pagination';
import getIDFromURL from './utils/getIDFromURL';
import getCurrentServer from './utils/getCurrentServer';
import formatDate from './utils/formatDate';
import { formatPlayerURL } from './utils/twstats';
import { formatTribeURL } from './utils/tribalwars';
import { setItem, getItem } from './utils/localStorage';

// ==UserScript==
// @name         Extended Player Profile
// @namespace    https://github.com/tribalwarshelp/scripts
// @updateURL    https://raw.githubusercontent.com/tribalwarshelp/scripts/master/dist/extendedPlayerProfile.js
// @downloadURL  https://raw.githubusercontent.com/tribalwarshelp/scripts/master/dist/extendedPlayerProfile.js
// @version      1.1.3
// @description  Extended Player Profile
// @author       Kichiyaki http://dawid-wysokinski.pl/
// @match        *://*/game.php*screen=info_player*
// @grant        none
// @run-at       document-end
// ==/UserScript==

const SERVER = getCurrentServer();
let PLAYER_ID = getIDFromURL(window.location.search);
const CURRENT_PLAYER_ID = parseInt(game_data.player.id);
if (isNaN(PLAYER_ID) || !PLAYER_ID) {
  PLAYER_ID = CURRENT_PLAYER_ID;
}
const LOCAL_STORAGE_KEY = 'kichiyaki_extended_player_profile' + PLAYER_ID;
const PLAYER_QUERY = `
    query player($server: String!, $id: Int!, $filter: DailyPlayerStatsFilter) {
        player(server: $server, id: $id) {
            id
            name
            bestRank
            bestRankAt
            mostPoints
            mostPointsAt
            mostVillages
            mostVillagesAt
            servers
            joinedAt
            nameChanges {
                oldName
                newName
                changeDate
            }
            dailyGrowth
        }
        dailyPlayerStats(server: $server, filter: $filter) {
            items {
              rank
              rankAtt
              rankDef
              rankSup
              rankTotal
              points
              scoreAtt
              scoreAtt
              scoreDef
              scoreSup
              scoreTotal
              villages
            }
        }
    }
`;
const TRIBE_CHANGES_QUERY = `
    query tribeChanges($server: String!, $filter: TribeChangeFilter!) {
      tribeChanges(server: $server, filter: $filter) {
        total
        items {
          oldTribe {
            id
            tag
          }
          newTribe {
            id
            tag
          }
          createdAt
        }
      }
    }
`;
const TRIBE_CHANGES_PAGINATION_CONTAINER_ID = 'tribeChangesPagination';
const TRIBE_CHANGES_PER_PAGE = 15;
const PLAYER_HISTORY_AND_PLAYER_DAILY_STATS_QUERY = `
query playerHistoryAndPlayerDailyStats($server: String!,
     $playerHistoryFilter: PlayerHistoryFilter!,
     $dailyPlayerStatsFilter: DailyPlayerStatsFilter!) {
  playerHistory(server: $server, filter: $playerHistoryFilter) {
    total
    items {
      totalVillages
      points
      rank
      scoreAtt
      rankAtt
      scoreDef
      rankDef
      scoreSup
      rankSup
      scoreTotal
      rankTotal
      tribe {
        id
        tag
      }
      createDate
    }
  }
  dailyPlayerStats(server: $server, filter: $dailyPlayerStatsFilter) {
    items {
        points
        scoreAtt
        scoreAtt
        scoreDef
        scoreSup
        scoreTotal
        villages
        createDate
      }
    }
}
`;
const PLAYER_HISTORY_PER_PAGE = 15;
const ENNOBLEMENTS_QUERY = `
    query ennoblements($server: String!, $filter: EnnoblementFilter!) {
      ennoblements(server: $server, filter: $filter) {
        total
        items {
          village {
            id
            name
            x
            y
          }
          oldOwner {
            id
            name
          }
          oldOwnerTribe {
            id
            tag
          }
          newOwner {
            id
            name
          }
          newOwnerTribe {
            id
            tag
          }
          ennobledAt
        }
      }
    }
`;
const ENNOBLEMENTS_PER_PAGE = 15;

const profileInfoTBody = document.querySelector('#player_info > tbody');
const actionContainer =
  PLAYER_ID === CURRENT_PLAYER_ID
    ? profileInfoTBody
    : document.querySelector(
        '#content_value > table > tbody > tr > td:nth-child(1) > table:nth-child(2) > tbody'
      );
const otherElementContainer = document.querySelector(
  PLAYER_ID === CURRENT_PLAYER_ID
    ? '#content_value > table:nth-child(7) > tbody > tr > td:nth-child(2)'
    : '#content_value > table > tbody > tr > td:nth-child(2)'
);
const translations = getTranslations();

const loadDataFromCache = () => {
  return getItem(LOCAL_STORAGE_KEY);
};

const cachePlayerData = (data = {}) => {
  setItem(LOCAL_STORAGE_KEY, data);
};

const loadInADayData = async (type, { name, ...rest } = {}) => {
  try {
    const response = await fetch(
      TribalWars.buildURL('', {
        screen: 'ranking',
        mode: 'in_a_day',
        type,
        name: name ? name : '',
      })
    );
    const html = await response.text();
    if (!html) {
      throw new Error();
    }
    const res = new InADayParser(html, rest).parse();
    if (res.length === 0) {
      throw new Error();
    }
    return res[0];
  } catch (error) {
    return {
      rank: 0,
      playerID: 0,
      score: 0,
      tribeID: 0,
      tribe: '',
      date: new Date(),
    };
  }
};

const loadData = async () => {
  const data = await requestCreator({
    query: PLAYER_QUERY,
    variables: {
      server: SERVER,
      id: PLAYER_ID,
      filter: {
        sort: 'createDate DESC',
        limit: 1,
        playerID: [PLAYER_ID],
      },
    },
  });
  if (data.player) {
    const inADay = {};
    inADay.att = await loadInADayData('kill_att', {
      name: data.player.name,
      playerID: data.player.id,
    });
    inADay.def = await loadInADayData('kill_def', {
      name: data.player.name,
      playerID: data.player.id,
    });
    inADay.sup = await loadInADayData('kill_sup', {
      name: data.player.name,
      playerID: data.player.id,
    });
    inADay.lootRes = await loadInADayData('loot_res', {
      name: data.player.name,
      playerID: data.player.id,
    });
    inADay.lootVil = await loadInADayData('loot_vil', {
      name: data.player.name,
      playerID: data.player.id,
    });
    inADay.scavenge = await loadInADayData('scavenge', {
      name: data.player.name,
      playerID: data.player.id,
    });
    inADay.conquer = await loadInADayData('conquer', {
      name: data.player.name,
      playerID: data.player.id,
    });
    data.player.inADay = inADay;
  }
  cachePlayerData(data);
  return data;
};

const renderTr = ({ title, data, id }) => {
  let tr = document.querySelector('#' + id);
  if (!tr) {
    tr = document.createElement('tr');
    tr.id = id;
    tr.appendChild(document.createElement('td'));
    tr.appendChild(document.createElement('td'));
    profileInfoTBody.append(tr);
  }
  tr.children[0].innerHTML = title;
  tr.children[1].innerHTML = data;
};

const renderPlayerServers = (player) => {
  let playerServers = document.querySelector('#playerServers');
  if (!playerServers) {
    playerServers = document.createElement('table');
    playerServers.id = 'playerServers';
    playerServers.classList.add('vis');
    playerServers.width = '100%';
    playerServers.innerHTML = `
     <tbody>
        <tr>
          <th>
            ${translations.playerServers}
          </th>
        </tr>
        <tr>
          <td>
          </td>
        </tr>
     </tbody>
    `;
    otherElementContainer.prepend(playerServers);
  }
  playerServers.querySelector('td').innerHTML = player.servers
    .sort()
    .map(
      (server) =>
        `<a target="_blank" rel="noopener noreferrer" style="margin-right: 5px" href="${formatPlayerURL(
          server,
          player.id
        )}">${server}</a>`
    )
    .join('');
};

const renderPlayerOtherNames = (player) => {
  let playerOtherNames = document.querySelector('#playerOtherNames');
  if (!playerOtherNames) {
    playerOtherNames = document.createElement('div');
    playerOtherNames.id = 'playerOtherNames';
    playerOtherNames.width = '100%';
    otherElementContainer.prepend(playerOtherNames);
  }
  playerOtherNames.innerHTML = `
      <table width="100%" class="vis">
        <tbody>
          <tr>
            <th>
            ${translations.oldName}
            </th>
            <th>
            ${translations.newName}
            </th>
            <th>
            ${translations.date}
            </th>
          </tr>
        ${player.nameChanges
          .map((nameChange) => {
            return `
            <tr>
              <td>
                ${nameChange.oldName}
              </td>
              <td>
                ${nameChange.newName}
              </td>
              <td>
                ${formatDate(nameChange.changeDate, {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })}
              </td>
            </tr>
          `;
          })
          .join('')}
      </tbody>
      </table>
  `;
};

const renderInADayRanks = (player) => {
  let inADayRanks = document.querySelector('#inADayRanks');
  if (!inADayRanks) {
    inADayRanks = document.createElement('div');
    inADayRanks.id = 'inADayRanks';
    inADayRanks.width = '100%';
    otherElementContainer.prepend(inADayRanks);
  }

  inADayRanks.innerHTML = `
      <table width="100%" class="vis">
        <tbody>
          <tr>
            <th colspan="2">
              ${translations.inADayBestScores}
            </th>
          </tr>
            <tr>
              <td>
                ${translations.unitsDefeatedWhileAttacking}
              </td>
              <td>
                ${player.inADay.att.score.toLocaleString()} (${
    player.inADay.att.rank
  }.)
              </td>
            </tr>
            <tr>
              <td>
                ${translations.unitsDefeatedWhileDefending}
              </td>
              <td>
                ${player.inADay.def.score.toLocaleString()} (${
    player.inADay.def.rank
  }.)
              </td>
            </tr>
            <tr>
              <td>
                ${translations.unitsDefeatedWhileSupporting}
              </td>
              <td>
                ${player.inADay.sup.score.toLocaleString()} (${
    player.inADay.sup.rank
  }.)
              </td>
            </tr>
            <tr>
              <td>
                ${translations.resourcesPlundered}
              </td>
              <td>
                ${player.inADay.lootRes.score.toLocaleString()} (${
    player.inADay.lootRes.rank
  }.)
              </td>
            </tr>
            <tr>
              <td>
                ${translations.villagesPlundered}
              </td>
              <td>
                ${player.inADay.lootVil.score.toLocaleString()} (${
    player.inADay.lootVil.rank
  }.)
              </td>
            </tr>
            <tr>
              <td>
                ${translations.resourcesGathered}
              </td>
              <td>
                ${player.inADay.scavenge.score.toLocaleString()} (${
    player.inADay.scavenge.rank
  }.)
              </td>
            </tr>
            <tr>
              <td>
                ${translations.villagesConquered}
              </td>
              <td>
                ${player.inADay.conquer.score.toLocaleString()} (${
    player.inADay.conquer.rank
  }.)
              </td>
            </tr>
      </tbody>
      </table>
  `;
};

const render = ({ player, dailyPlayerStats }) => {
  [
    {
      title: translations.joinedAt + ':',
      data: formatDate(player.joinedAt),
      id: 'joined_at',
    },
    {
      title: translations.dailyGrowth + ':',
      data: player.dailyGrowth.toLocaleString(),
      id: 'dg',
    },
    {
      title: translations.bestRank + ':',
      data: player.bestRank + ' ' + `(${formatDate(player.bestRankAt)})`,
      id: 'best_rank',
    },
    {
      title: translations.mostPoints + ':',
      data:
        player.mostPoints.toLocaleString() +
        ' ' +
        `(${formatDate(player.mostPointsAt)})`,
      id: 'most_points',
    },
    {
      title: translations.mostVillages + ':',
      data:
        player.mostVillages + ' ' + `(${formatDate(player.mostVillagesAt)})`,
      id: 'most_villages',
    },
  ].forEach((data) => {
    renderTr(data);
  });

  renderInADayRanks(player);
  if (dailyPlayerStats && dailyPlayerStats.items.length > 0) {
    renderTodaysStats(otherElementContainer, dailyPlayerStats.items[0]);
  }
  if (player.nameChanges.length > 0) {
    renderPlayerOtherNames(player);
  }
  if (player.servers.length > 0) {
    renderPlayerServers(player);
  }
};

const renderTribeChanges = (e, currentPage, tribeChanges) => {
  const paginationItems = generatePaginationItems({
    total: tribeChanges.total,
    limit: TRIBE_CHANGES_PER_PAGE,
    currentPage,
  });
  const html = `
    <div style="${getContainerStyles()}" id="${TRIBE_CHANGES_PAGINATION_CONTAINER_ID}">
      ${paginationItems.join('')}
    </div>
    <table class="vis" style="border-collapse: separate; border-spacing: 2px; width: 100%;">
      <tbody>
        <tr>
          <th>
            ${translations.date}
          </th>
          <th>
            ${translations.newTribe}
          </th>
          <th>
            ${translations.oldTribe}
          </th>
        </tr>
        ${tribeChanges.items
          .map((tribeChange) => {
            let rowHTML =
              '<tr>' + `<td>${formatDate(tribeChange.createdAt)}</td>`;
            if (tribeChange.newTribe) {
              rowHTML += `<td><a href="${formatTribeURL(
                tribeChange.newTribe.id
              )}">${tribeChange.newTribe.tag}</a></td>`;
            } else {
              rowHTML += '<td>-</td>';
            }
            if (tribeChange.oldTribe) {
              rowHTML += `<td><a href="${formatTribeURL(
                tribeChange.oldTribe.id
              )}">${tribeChange.oldTribe.tag}</a></td>`;
            } else {
              rowHTML += '<td>-</td>';
            }
            return rowHTML + '</tr>';
          })
          .join('')}
      </tbody>
    </table>
  `;

  showPopup({
    e,
    title: translations.tribeChanges,
    id: 'tribeChanges',
    html,
  });

  document
    .querySelectorAll('#' + TRIBE_CHANGES_PAGINATION_CONTAINER_ID + ' a')
    .forEach((el) => {
      el.addEventListener('click', handleShowTribeChangesButtonClick);
    });
};

const handleShowTribeChangesButtonClick = async (e) => {
  e.preventDefault();
  const page = getPage(e.target);
  if (!isNaN(page)) {
    const data = await requestCreator({
      query: TRIBE_CHANGES_QUERY,
      variables: {
        filter: {
          playerID: [PLAYER_ID],
          offset: TRIBE_CHANGES_PER_PAGE * (page - 1),
          limit: TRIBE_CHANGES_PER_PAGE,
          sort: 'createdAt DESC',
        },
        server: SERVER,
      },
    });
    renderTribeChanges(e, page, data.tribeChanges);
  }
};

const handleShowPlayerHistoryClick = async (e) => {
  e.preventDefault();
  const page = getPage(e.target);
  if (!isNaN(page)) {
    try {
      const filter = {
        playerID: [PLAYER_ID],
        offset: PLAYER_HISTORY_PER_PAGE * (page - 1),
        limit: PLAYER_HISTORY_PER_PAGE,
        sort: 'createDate DESC',
      };
      const { playerHistory, dailyPlayerStats } = await requestCreator({
        query: PLAYER_HISTORY_AND_PLAYER_DAILY_STATS_QUERY,
        variables: {
          server: SERVER,
          playerHistoryFilter: filter,
          dailyPlayerStatsFilter: {
            ...filter,
            offset: filter.offset + 1,
          },
        },
      });
      showHistoryPopup(e, playerHistory, dailyPlayerStats, {
        currentPage: page,
        limit: PLAYER_HISTORY_PER_PAGE,
        onPageChange: handleShowPlayerHistoryClick,
        tribe: false,
      });
    } catch (error) {
      console.log('cannot load player history', error);
    }
  }
};

const handleShowPlayerEnnoblementsClick = async (e) => {
  e.preventDefault();
  const page = getPage(e.target);
  if (!isNaN(page)) {
    const data = await requestCreator({
      query: ENNOBLEMENTS_QUERY,
      variables: {
        filter: {
          or: {
            oldOwnerID: [PLAYER_ID],
            newOwnerID: [PLAYER_ID],
          },
          offset: ENNOBLEMENTS_PER_PAGE * (page - 1),
          limit: ENNOBLEMENTS_PER_PAGE,
          sort: 'ennobledAt DESC',
        },
        server: SERVER,
      },
    });
    showEnnoblementsPopup(e, data.ennoblements, {
      currentPage: page,
      limit: ENNOBLEMENTS_PER_PAGE,
      onPageChange: handleShowPlayerEnnoblementsClick,
    });
  }
};

const handleExportPlayerVillagesButtonClick = (e) => {
  e.preventDefault();

  Dialog.show(
    translations.exportedVillages,
    `<textarea cols=30 rows=8 readonly>${document
      .querySelector('#villages_list')
      .innerHTML.match(/(\d+)\|(\d+)/g)
      .join(' ')}</textarea>`
  );
};

const wrapAction = (action) => {
  const actionWrapperTd = document.createElement('td');
  actionWrapperTd.colSpan = '2';
  actionWrapperTd.append(action);
  const actionWrapperTr = document.createElement('tr');
  actionWrapperTr.appendChild(actionWrapperTd);
  return actionWrapperTr;
};

const renderActions = () => {
  const showTribeChanges = document.createElement('a');
  showTribeChanges.href = '#';
  setPage(showTribeChanges, '1');
  showTribeChanges.innerHTML = translations.action.showTribeChanges;
  showTribeChanges.addEventListener('click', handleShowTribeChangesButtonClick);
  actionContainer.appendChild(wrapAction(showTribeChanges));

  const showPlayerHistory = document.createElement('a');
  showPlayerHistory.href = '#';
  setPage(showPlayerHistory, '1');
  showPlayerHistory.innerHTML = translations.action.showHistory;
  showPlayerHistory.addEventListener('click', handleShowPlayerHistoryClick);
  actionContainer.appendChild(wrapAction(showPlayerHistory));

  const showEnnoblements = document.createElement('a');
  showEnnoblements.href = '#';
  setPage(showEnnoblements, '1');
  showEnnoblements.innerHTML = translations.action.showEnnoblements;
  showEnnoblements.addEventListener('click', handleShowPlayerEnnoblementsClick);
  actionContainer.appendChild(wrapAction(showEnnoblements));

  const exportPlayerVillages = document.createElement('a');
  exportPlayerVillages.href = '#';
  exportPlayerVillages.innerHTML = translations.action.exportVillages;
  exportPlayerVillages.addEventListener(
    'click',
    handleExportPlayerVillagesButtonClick
  );
  actionContainer.appendChild(wrapAction(exportPlayerVillages));
};

(async function () {
  try {
    renderActions();

    const dataFromCache = loadDataFromCache();
    if (dataFromCache && dataFromCache.player) {
      render(dataFromCache);
    }

    const dataFromAPI = await loadData();
    if (dataFromAPI) {
      render(dataFromAPI);
    }
  } catch (error) {
    console.log('extended player profile', error);
  }
})();

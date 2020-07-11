import requestCreator from './libs/requestCreator';
import InADayParser from './libs/InADayParser';
import getIDFromURL from './utils/getIDFromURL';
import getCurrentServer from './utils/getCurrentServer';
import formatDate from './utils/formatDate';
import { formatPlayerURL } from './utils/twstats';
import { setItem, getItem } from './utils/localStorage';

// ==UserScript==
// @name         Extended Player Profile
// @namespace    https://gist.github.com/Kichiyaki/3c273582cc6856512e22c86c375f795a
// @version      0.1
// @description  Extended Player Profile
// @author       Kichiyaki http://dawid-wysokinski.pl/
// @match        *://*.plemiona.pl/game.php*&screen=info_player*
// @match        *://*.tribalwars.net/game.php*&screen=info_player*
// @grant        none
// ==/UserScript==

const SERVER = getCurrentServer();
let PLAYER_ID = getIDFromURL(window.location.search);
const CURRENT_PLAYER_ID = parseInt(game_data.player.id);
if (isNaN(PLAYER_ID) || !PLAYER_ID) {
  PLAYER_ID = CURRENT_PLAYER_ID;
}
const LOCAL_STORAGE_KEY = 'kichiyaki_extended_player_profile' + PLAYER_ID;
const query = `
    query pageData($server: String!, $id: Int!, $filter: DailyPlayerStatsFilter) {
        player(server: $server, id: $id) {
            id
            name
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

const profileInfoTBody = document.querySelector('#player_info > tbody');
const otherElementsContainer = document.querySelector(
  PLAYER_ID === CURRENT_PLAYER_ID
    ? '#content_value > table:nth-child(7) > tbody > tr > td:nth-child(2)'
    : '#content_value > table > tbody > tr > td:nth-child(2)'
);

const loadDataFromCache = () => {
  return getItem(LOCAL_STORAGE_KEY);
};

const cachePlayerData = (data = {}) => {
  setItem(LOCAL_STORAGE_KEY, data);
};

const loadInADayRankAndScore = async (name, playerID, type) => {
  try {
    const response = await fetch(
      TribalWars.buildURL('', {
        screen: 'ranking',
        mode: 'in_a_day',
        type,
        name,
      })
    );
    const html = await response.text();
    const res = new InADayParser(html, { playerID }).parse();
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
      date: new Date(),
    };
  }
};

const loadData = async () => {
  const data = await requestCreator({
    query,
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
    inADay.att = await loadInADayRankAndScore(
      data.player.name,
      data.player.id,
      'kill_att'
    );
    inADay.def = await loadInADayRankAndScore(
      data.player.name,
      data.player.id,
      'kill_def'
    );
    inADay.sup = await loadInADayRankAndScore(
      data.player.name,
      data.player.id,
      'kill_sup'
    );
    inADay.lootRes = await loadInADayRankAndScore(
      data.player.name,
      data.player.id,
      'loot_res'
    );
    inADay.lootVil = await loadInADayRankAndScore(
      data.player.name,
      data.player.id,
      'loot_vil'
    );
    inADay.scavenge = await loadInADayRankAndScore(
      data.player.name,
      data.player.id,
      'scavenge'
    );
    inADay.conquer = await loadInADayRankAndScore(
      data.player.name,
      data.player.id,
      'conquer'
    );
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
            Player's Servers
          </th>
        </tr>
        <tr>
          <td>
          </td>
        </tr>
     </tbody>
    `;
    otherElementsContainer.prepend(playerServers);
  }
  playerServers.querySelector('td').innerHTML = player.servers
    .sort()
    .map(
      (server) =>
        `<a style="margin-right: 5px" href="${formatPlayerURL(
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
    otherElementsContainer.prepend(playerOtherNames);
  }
  playerOtherNames.innerHTML = `
      <table width="100%" class="vis">
        <tbody>
          <tr>
            <th>
              Old name
            </th>
            <th>
              New name
            </th>
            <th>
              Date
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
                  month: 'numeric',
                  day: 'numeric',
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

const renderTodaysStats = (stats) => {
  let todaysStats = document.querySelector('#todaysStats');
  if (!todaysStats) {
    todaysStats = document.createElement('div');
    todaysStats.id = 'todaysStats';
    todaysStats.width = '100%';
    otherElementsContainer.prepend(todaysStats);
  }
  const statIncreaseStyle = 'color: #000; background-color: #0f0';
  const statDecreaseStyle = 'color: #000; background-color: #f00';

  todaysStats.innerHTML = `
      <table width="100%" class="vis">
        <tbody>
          <tr>
            <th colspan="2">
              Today's stats
            </th>
          </tr>
            <tr>
              <td>
                Points
              </td>
              <td style="${
                stats.points > 0 ? statIncreaseStyle : statDecreaseStyle
              }">
                ${Math.abs(stats.points).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td>
                Rank
              </td>
              <td style="${
                stats.rank > 0 ? statIncreaseStyle : statDecreaseStyle
              }">
                ${Math.abs(stats.rank)}
              </td>
            </tr>
            <tr>
              <td>
                Villages
              </td>
              <td style="${
                stats.villages > 0 ? statIncreaseStyle : statDecreaseStyle
              }">
                ${Math.abs(stats.villages).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td>
                Score att
              </td>
              <td style="${
                stats.scoreAtt > 0 ? statIncreaseStyle : statDecreaseStyle
              }">
                ${Math.abs(stats.scoreAtt).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td>
                Rank (ODA)
              </td>
              <td style="${
                stats.rankAtt > 0 ? statIncreaseStyle : statDecreaseStyle
              }">
                ${Math.abs(stats.rankAtt)}
              </td>
            </tr>
            <tr>
              <td>
                Score def
              </td>
              <td style="${
                stats.scoreDef > 0 ? statIncreaseStyle : statDecreaseStyle
              }">
                ${Math.abs(stats.scoreDef).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td>
                Rank (ODD)
              </td>
              <td style="${
                stats.rankDef > 0 ? statIncreaseStyle : statDecreaseStyle
              }">
                ${Math.abs(stats.rankDef)}
              </td>
            </tr>
            <tr>
              <td>
                Score sup
              </td>
              <td style="${
                stats.scoreSup > 0 ? statIncreaseStyle : statDecreaseStyle
              }">
                ${Math.abs(stats.scoreSup).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td>
                Rank (ODS)
              </td>
              <td style="${
                stats.rankSup > 0 ? statIncreaseStyle : statDecreaseStyle
              }">
                ${Math.abs(stats.rankSup)}
              </td>
            </tr>
            <tr>
              <td>
                Score total
              </td>
              <td style="${
                stats.scoreTotal > 0 ? statIncreaseStyle : statDecreaseStyle
              }">
                ${Math.abs(stats.scoreTotal).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td>
                Rank (OD)
              </td>
              <td style="${
                stats.rankTotal > 0 ? statIncreaseStyle : statDecreaseStyle
              }">
                ${Math.abs(stats.rankTotal)}
              </td>
            </tr>
      </tbody>
      </table>
  `;
};

const render = ({ player, dailyPlayerStats }) => {
  [
    {
      title: 'Joined at:',
      data: formatDate(player.joinedAt),
      id: 'joined_at',
    },
    {
      title: 'Daily growth:',
      data: player.dailyGrowth.toLocaleString(),
      id: 'dg',
    },
    {
      title: 'Units defeated while attacking:',
      data: `${player.inADay.att.score.toLocaleString()} (${
        player.inADay.att.rank
      }.)`,
      id: 'kill_att',
    },
    {
      title: 'Units defeated while defending:',
      data: `${player.inADay.def.score.toLocaleString()} (${
        player.inADay.def.rank
      }.)`,
      id: 'kill_def',
    },
    {
      title: 'Units defeated while supporting:',
      data: `${player.inADay.sup.score.toLocaleString()} (${
        player.inADay.sup.rank
      }.)`,
      id: 'kill_sup',
    },
    {
      title: 'Resources plundered:',
      data: `${player.inADay.lootRes.score.toLocaleString()} (${
        player.inADay.lootRes.rank
      }.)`,
      id: 'loot_res',
    },
    {
      title: 'Villages plundered:',
      data: `${player.inADay.lootVil.score.toLocaleString()} (${
        player.inADay.lootVil.rank
      }.)`,
      id: 'loot_vil',
    },
    {
      title: 'Resources gathered:',
      data: `${player.inADay.scavenge.score.toLocaleString()} (${
        player.inADay.scavenge.rank
      }.)`,
      id: 'scavenge',
    },
    {
      title: 'Villages conquered:',
      data: `${player.inADay.conquer.score.toLocaleString()} (${
        player.inADay.conquer.rank
      }.)`,
      id: 'conquer',
    },
  ].forEach((data) => {
    renderTr(data);
  });

  if (dailyPlayerStats && dailyPlayerStats.items.length > 0) {
    renderTodaysStats(dailyPlayerStats.items[0]);
  }
  if (player.nameChanges.length > 0) {
    renderPlayerOtherNames(player);
  }
  if (player.servers.length > 0) {
    renderPlayerServers(player);
  }
};

(async function () {
  try {
    const dataFromCache = loadDataFromCache();
    if (dataFromCache && dataFromCache.player) {
      render(dataFromCache);
    }
    const dataFromAPI = await loadData();
    if (dataFromAPI) {
      render(dataFromAPI);
    }
    console.log(dataFromAPI);
  } catch (error) {
    console.log('extended player profile', error);
  }
})();

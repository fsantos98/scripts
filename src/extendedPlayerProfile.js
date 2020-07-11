import requestCreator from './libs/requestCreator';
import InADayParser from './libs/InADayParser';
import getIDFromURL from './utils/getIDFromURL';
import getCurrentServer from './utils/getCurrentServer';
import formatDate from './utils/formatDate';
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
if (isNaN(PLAYER_ID) || !PLAYER_ID) {
  PLAYER_ID = parseInt(game_data.player.id);
}
const LOCAL_STORAGE_KEY = 'kichiyaki_extended_player_profile' + PLAYER_ID;
const PLAYER_QUERY = `
    query player($server: String!, $id: Int!) {
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
    }
`;
const dataContainer = document.querySelector('#player_info > tbody');

const loadPlayerDataFromCache = () => {
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
    console.log(error);
    return {
      rank: 0,
      playerID: 0,
      score: 0,
      tribeID: 0,
      date: new Date(),
    };
  }
};

const loadPlayerData = async () => {
  const data = await requestCreator({
    query: PLAYER_QUERY,
    variables: {
      server: SERVER,
      id: PLAYER_ID,
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
    dataContainer.append(tr);
  }
  tr.children[0].innerHTML = title;
  tr.children[1].innerHTML = data;
};

const render = (player) => {
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
};

(async function () {
  try {
    const { player: playerDataFromCache } = loadPlayerDataFromCache();
    if (playerDataFromCache) {
      render(playerDataFromCache);
    }
    const { player } = await loadPlayerData();
    if (player) {
      render(player);
    }
    console.log(player);
  } catch (error) {
    console.log('extended player profile', error);
  }
})();

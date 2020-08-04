parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"Ph2E":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=exports.API_URI=void 0;const e="https://api.tribalwarshelp.com/graphql";exports.API_URI=e;var r=function(){let{query:r,variables:t={}}=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return fetch(e,{method:"POST",body:JSON.stringify({query:r,variables:t}),headers:{"Content-Type":"application/json"}}).then(e=>e.json()).then(e=>{let{data:r,errors:t}=e;if(t&&Array.isArray(t)&&t.length>0)throw new Error(t[0].message);return new Promise(e=>e(r))})};exports.default=r;
},{}],"rX6I":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;const e={pl_PL:{title:"Dzienne osiągnięcia - prawdopodobni gracze",warning:"Pamiętaj! Ten skrypt pokazuje wykalkulowane przez TribalWars wyniki, nie pokonane jednostki.",aotd:"Agresor dnia",dotd:"Obrońca dnia",sotd:"Pomocnik dnia",gpotd:"Mocarstwo dnia"},en_DK:{title:"Daily achievements - probable players",warning:"Remember! This script shows scores, not defeated units.",aotd:"Attacker of the day",dotd:"Defender of the day",sotd:"Supporter of the day",gpotd:"Great power of the day"}};var o=()=>e[window.game_data.locale]||e.en_DK;exports.default=o;
},{}],"KWxH":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.setItem=exports.getItem=void 0;const e=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};const o=localStorage.getItem(e);let s=t;return o&&(s=JSON.parse(o)),s};exports.getItem=e;const t=(e,t)=>{localStorage.setItem(e,JSON.stringify(t))};exports.setItem=t;
},{}],"tQUs":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;var e=e=>parseInt(new URLSearchParams(e).get("id"));exports.default=e;
},{}],"dSAr":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;var e=r(require("../utils/getIDFromURL"));function r(e){return e&&e.__esModule?e:{default:e}}class t{constructor(e){let r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.dom=(new DOMParser).parseFromString(e,"text/html"),this.filters=r}isValidRow(e){return!!e&&(!this.filters.playerID||e.playerID===this.filters.playerID)}parseRow(r){if(!r||!r instanceof HTMLTableRowElement)return;let t={};return t.rank=parseInt(r.children[0].innerText.trim()),t.name=r.children[1].innerText.trim(),t.playerID=(0,e.default)(r.children[1].querySelector("a").getAttribute("href")),t.tribe=r.children[2].innerText.trim(),t.tribeID=0,t.tribe&&(t.tribeID=(0,e.default)(r.children[2].querySelector("a").getAttribute("href"))),t.score=parseInt(r.children[3].innerText.trim().replace(/\./g,"")),t.date=r.children[4].innerText.trim(),t}parse(){const e=this.dom.querySelectorAll("#in_a_day_ranking_table tbody tr"),r=[];for(let t=1;t<e.length;t++){const i=e[t],n=this.parseRow(i);this.isValidRow(n)&&r.push(n)}return r}}exports.default=t;
},{"../utils/getIDFromURL":"tQUs"}],"fHHP":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.buildImgURL=exports.calcAttackDuration=exports.loadInADayData=exports.formatVillageName=exports.formatVillageURL=exports.formatPlayerURL=exports.formatTribeURL=void 0;var t=e(require("../libs/InADayParser"));function e(t){return t&&t.__esModule?t:{default:t}}function r(t,e){if(null==t)return{};var r,n,a=o(t,e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(t);for(n=0;n<i.length;n++)r=i[n],e.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(t,r)&&(a[r]=t[r])}return a}function o(t,e){if(null==t)return{};var r,o,n={},a=Object.keys(t);for(o=0;o<a.length;o++)r=a[o],e.indexOf(r)>=0||(n[r]=t[r]);return n}const n=t=>window.location.origin+TribalWars.buildURL("",{screen:"info_ally",id:t});exports.formatTribeURL=n;const a=t=>window.location.origin+TribalWars.buildURL("",{screen:"info_player",id:t});exports.formatPlayerURL=a;const i=t=>window.location.origin+TribalWars.buildURL("",{screen:"info_village",id:t});exports.formatVillageURL=i;const l=function(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:500,r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:500;const o="K"+String(r)[0]+String(e)[0];return"".concat(t," (").concat(e,"|").concat(r,") ").concat(o)};exports.formatVillageName=l;const c=async function(e){let o=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},{name:n}=o,a=r(o,["name"]);try{const r=await fetch(TribalWars.buildURL("",{screen:"ranking",mode:"in_a_day",type:e,name:n||""})),o=await r.text();if(!o)throw new Error;const l=new t.default(o,a).parse();if(0===l.length)throw new Error;return l[0]}catch(i){return{rank:0,playerID:0,score:0,tribeID:0,date:new Date}}};exports.loadInADayData=c;const s=(t,e,r)=>Math.round(t*r/e);exports.calcAttackDuration=s;const u=t=>image_base+t;exports.buildImgURL=u;
},{"../libs/InADayParser":"dSAr"}],"DMkL":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;var e=()=>window.location.host.split(".")[0];exports.default=e;
},{}],"Jg9g":[function(require,module,exports) {
"use strict";var e=i(require("./libs/requestCreator")),r=i(require("./i18n/dailyAchievments")),t=require("./utils/localStorage"),a=require("./utils/tribalwars"),n=i(require("./utils/getCurrentServer"));function i(e){return e&&e.__esModule?e:{default:e}}function c(e,r){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);r&&(a=a.filter(function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable})),t.push.apply(t,a)}return t}function o(e){for(var r=1;r<arguments.length;r++){var t=null!=arguments[r]?arguments[r]:{};r%2?c(Object(t),!0).forEach(function(r){s(e,r,t[r])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):c(Object(t)).forEach(function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(t,r))})}return e}function s(e,r,t){return r in e?Object.defineProperty(e,r,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[r]=t,e}const l=(0,n.default)(),d="kichiyaki_daily_achievements",y="\n    query server($server: String!) {\n        server(key: $server) {\n            key\n            historyUpdatedAt\n        }\n    }\n",p='\n    query data($server: String!, $createDateGTE: Time!) {\n        dailyPlayerStatsOrderedByScoreAtt: dailyPlayerStats(server: $server, filter: { sort: "scoreAtt DESC", createDateGTE: $createDateGTE, playerFilter: { sort: "id DESC" }, limit: 5 }) {\n            items {\n                scoreAtt\n                player {\n                    id\n                    name\n                }\n            }\n        }\n        dailyPlayerStatsOrderedByScoreDef: dailyPlayerStats(server: $server, filter: { sort: "scoreDef DESC", createDateGTE: $createDateGTE, playerFilter: { sort: "id DESC" }, limit: 5 }) {\n            items {\n                scoreDef\n                player {\n                    id\n                    name\n                }\n            }\n        }\n        dailyPlayerStatsOrderedByScoreSup: dailyPlayerStats(server: $server, filter: { sort: "scoreSup DESC", createDateGTE: $createDateGTE, playerFilter: { sort: "id DESC" }, limit: 5 }) {\n            items {\n                scoreSup\n                player {\n                    id\n                    name\n                }\n            }\n        }\n        dailyPlayerStatsOrderedByVillages: dailyPlayerStats(server: $server, filter: { sort: "villages DESC", createDateGTE: $createDateGTE, playerFilter: { sort: "id DESC" }, limit: 5 }) {\n            items {\n                villages\n                player {\n                    id\n                    name\n                }\n            }\n        }\n    }\n';let u=void 0;const v=(0,r.default)(),g=()=>(0,t.getItem)(d),f=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};(0,t.setItem)(d,e)},S=async()=>{let r=await(0,e.default)({query:y,variables:{server:l}});if(r.server){const t=await(0,e.default)({query:p,variables:{server:l,createDateGTE:r.server.historyUpdatedAt.split("T")[0]+"T00:00:00Z"}});r=o(o({},r),t)}return f(r),r},m=e=>{let{dailyPlayerStatsOrderedByScoreAtt:r,dailyPlayerStatsOrderedByScoreDef:t,dailyPlayerStatsOrderedByScoreSup:n,dailyPlayerStatsOrderedByVillages:i}=e;const c='\n        <div class="award-group-head">'.concat(v.title,'</div>\n        <div class="award-group-content" style="text-align: center;">\n            <div style="padding: 10px;">\n                <h3 style="color: red;"><strong>').concat(v.warning,"</strong></h3>\n                <p><strong>").concat(v.aotd,"</strong></p>\n                ").concat(r.items.map((e,r)=>"<span>".concat(r+1,'. <a href="').concat((0,a.formatPlayerURL)(e.player.id),'">').concat(e.player.name," - ").concat(e.scoreAtt.toLocaleString(),"</a></span>")).join("<br>"),'\n            </div>\n            <hr>\n            <div style="padding: 10px;">\n                <p><strong>').concat(v.dotd,"</strong></p>\n                ").concat(t.items.map((e,r)=>"<span>".concat(r+1,'. <a href="').concat((0,a.formatPlayerURL)(e.player.id),'">').concat(e.player.name," - ").concat(e.scoreDef.toLocaleString(),"</a></span>")).join("<br>"),'\n            </div>\n            <hr>\n            <div style="padding: 10px;">\n                <p><strong>').concat(v.sotd,"</strong></p>\n                ").concat(n.items.map((e,r)=>"<span>".concat(r+1,'. <a href="').concat((0,a.formatPlayerURL)(e.player.id),'">').concat(e.player.name," - ").concat(e.scoreSup.toLocaleString(),"</a></span>")).join("<br>"),'\n            </div>\n            <hr>\n            <div style="padding: 10px;">\n                <p><strong>').concat(v.gpotd,"</strong></p>\n                ").concat(i.items.map((e,r)=>"<span>".concat(r+1,'. <a href="').concat((0,a.formatPlayerURL)(e.player.id),'">').concat(e.player.name," - ").concat(e.villages.toLocaleString(),"</a></span>")).join("<br>"),'\n            </div>\n        </div>\n        <div class="award-group-foot"></div>\n    ');u||((u=document.createElement("div")).classList.add("award-group"),document.querySelector("#content_value > div:nth-child(4)").prepend(u)),u.innerHTML=c};!async function(){try{const r=g();r&&r.server&&m(r);const t=await S();t.server&&m(t)}catch(e){console.log("dailyAchievements",e)}}();
},{"./libs/requestCreator":"Ph2E","./i18n/dailyAchievments":"rX6I","./utils/localStorage":"KWxH","./utils/tribalwars":"fHHP","./utils/getCurrentServer":"DMkL"}]},{},["Jg9g"], null)
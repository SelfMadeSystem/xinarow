import './style.scss';

import { OnlineClientRoom } from './OnlineClientRoom';
import { create, join } from './GameHandler';
import { colorName } from '../share/PlayerColor';
import { capitalizeFirst } from '../share/Utils';
import { OfflineClientRoom } from './OfflineClientRoom';
import { GridType, RoomOptions, TeamOrder } from '../share/Protocol';
import { setUsername, getUsername } from './GameHandler';

const mainMenuOverlay = document.getElementById('main-menu')! as HTMLDivElement;
const loadingOverlay = document.getElementById('loading')! as HTMLDivElement;
// const joinGameOverlay = document.getElementById('join-game')! as HTMLDivElement
// const createGameOverlay = document.getElementById('create-game')! as HTMLDivElement

const statusOverlay = document.getElementById('turn')! as HTMLDivElement;
const timeOverlay = document.getElementById('time')! as HTMLDivElement;

export function setTurnText(turn: number, myTurn: number, teamSize: number, username?: string) {
    if (turn === myTurn) {
        setStatusText("It's your turn.");
    } else {
        if (username == null) { // We're (probably) offline
            if (teamSize === 1) { // Red's turn .
                setStatusText(`${capitalizeFirst(colorName(turn))}'s turn.`);
            } else { // Red #1's turn .
                setStatusText(`${capitalizeFirst(colorName(Math.floor(turn / teamSize)))} #${turn % teamSize + 1}'s turn.`);
            }
        } else {
            if (teamSize === 1) { // It's Dude101 (red)'s turn .
                setStatusText(`It's ${username} (${colorName(turn)})'s turn.`);
            } else { // It's Dude101 (red #1)'s turn .
                setStatusText(`It's ${username} (${colorName(Math.floor(turn / teamSize))} #${turn % teamSize + 1})'s turn.`);
            }
        }
    }
}

export function setStatusText(text: string) {
    statusOverlay.innerText = text;
}

export function setTimeText(text: string) {
    timeOverlay.innerText = text;
}

const username = document.getElementById('username-input')! as HTMLInputElement;
username.value = getUsername();

function onUsernameChange() {
    setUsername(username.value);
}

username.addEventListener("change", onUsernameChange);
username.addEventListener("keyup", onUsernameChange);
username.addEventListener("input", onUsernameChange);

const joinButton = document.getElementById('join-button')! as HTMLButtonElement;
const joinName = document.getElementById('join-name')! as HTMLInputElement;

joinButton.addEventListener('click', async () => {
    const roomName = joinName.value;

    mainMenuOverlay.style.display = 'none';
    loadingOverlay.style.visibility = 'visible';

    const result = await join(roomName);

    loadingOverlay.style.visibility = '';

    if (typeof result === 'string') {
        console.log(result);
        mainMenuOverlay.style.display = '';
        alert(result);
        return;
    }
    statusOverlay.style.visibility = 'visible';
    console.log('Game started');
    const [options] = result;

    const room = new OnlineClientRoom(roomName, options);

    room.closeCb = () => {
        mainMenuOverlay.style.display = '';
        loadingOverlay.style.visibility = '';
        statusOverlay.style.visibility = '';
    };
});

const createButton = document.getElementById('create-button')! as HTMLButtonElement;
const createName = document.getElementById('create-name')! as HTMLInputElement;
const createGravity = document.getElementById('create-gravity')! as HTMLInputElement;
const createGridType = document.getElementById('create-grid-type')! as HTMLSelectElement;
const createNInARow = document.getElementById('create-n-in-a-row')! as HTMLInputElement;
const createTeamCount = document.getElementById('create-team-count')! as HTMLInputElement;
const createTeamSize = document.getElementById('create-team-size')! as HTMLInputElement;
const createTeamOrder = document.getElementById('create-team-order')! as HTMLSelectElement;
const createWidth = document.getElementById('create-width')! as HTMLInputElement;
const createHeight = document.getElementById('create-height')! as HTMLInputElement;
const createExpandLength = document.getElementById('create-expand-length')! as HTMLInputElement;
const createExpandDensity = document.getElementById('create-expand-density')! as HTMLInputElement;
const createOnline = document.getElementById('create-online')! as HTMLInputElement;

createButton.addEventListener('click', async () => {
    const roomName = createName.value as string;
    const gravity = createGravity.checked;
    const gridType = createGridType.value as GridType;
    const nInARow = parseInt(createNInARow.value);
    const teamCount = parseInt(createTeamCount.value);
    const teamSize = parseInt(createTeamSize.value);
    const teamOrder = createTeamOrder.value as TeamOrder;
    const width = parseInt(createWidth.value);
    const height = parseInt(createHeight.value) * (gridType === 'triangle' ? 2 : 1);
    const expandLength = parseInt(createExpandLength.value);
    const expandDensity = parseFloat(createExpandDensity.value);
    const online = createOnline.checked;

    mainMenuOverlay.style.display = 'none';
    loadingOverlay.style.visibility = 'visible';

    const options: RoomOptions = {
        nInARow, teamCount, teamSize, teamOrder, gravity, gridType,
        width, height, expandLength, expandDensity
    };

    const result = online ? await (create(roomName, options)) : [0];

    loadingOverlay.style.visibility = '';

    if (typeof result === 'string') {
        console.log(result);
        mainMenuOverlay.style.display = '';
        alert(result);
        return;
    }
    statusOverlay.style.visibility = 'visible';
    console.log('Game started');

    const room = new (online ? OnlineClientRoom : OfflineClientRoom)(roomName, options);

    room.closeCb = () => {
        mainMenuOverlay.style.display = '';
        loadingOverlay.style.visibility = '';
        statusOverlay.style.visibility = '';
    };

    room.placedThingCb = () => {
        loadingOverlay.style.visibility = 'visible';
    };

    room.serverPlacedThingCb = () => {
        loadingOverlay.style.visibility = '';
    };
});
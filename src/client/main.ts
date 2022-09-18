import './style.scss'

import { ClientRoom } from './ClientRoom';
import { create, join } from './GameHandler';
import { colorName, PlayerColor } from '../share/PlayerColor';
import { capitalizeFirst } from '../share/Utils';

const loadingOverlay = document.getElementById('loading')! as HTMLDivElement;
const joinGameOverlay = document.getElementById('join-game')! as HTMLDivElement
const createGameOverlay = document.getElementById('create-game')! as HTMLDivElement

const statusOverlay = document.getElementById('turn')! as HTMLDivElement

export function setTurnText(turn: PlayerColor, color: PlayerColor) {
    if (turn === color) {
        setStatusText("It's your turn.");
    } else {
        setStatusText(`${capitalizeFirst(colorName(turn))}'s turn.`);
    }
}

export function setStatusText(text: string) {
    statusOverlay.innerText = text;
}

const joinButton = document.getElementById('join-button')! as HTMLButtonElement
const joinName = document.getElementById('join-name')! as HTMLInputElement

joinButton.addEventListener('click', async () => {
    const roomName = joinName.value;

    joinGameOverlay.style.display = 'none'
    createGameOverlay.style.display = 'none'
    loadingOverlay.style.visibility = 'visible'

    const result = await join(roomName);

    loadingOverlay.style.visibility = ''

    if (typeof result === 'string') {
        console.log(result);
        joinGameOverlay.style.display = '';
        createGameOverlay.style.display = '';
        alert(result);
        return;
    }
    statusOverlay.style.visibility = 'visible'
    console.log('Game started')
    const color = result[0];
    const nInARow = result[1];
    const infinite = result[2];
    const width = infinite ? undefined : result[3];
    const height = infinite ? undefined : result[4];
    console.log(result, infinite, width, height);

    const room = new ClientRoom(roomName, color, nInARow, width, height)

    room.closeCb = () => {
        joinGameOverlay.style.display = '';
        createGameOverlay.style.display = '';
        loadingOverlay.style.visibility = '';
        statusOverlay.style.visibility = '';
    }
})

const createButton = document.getElementById('create-button')! as HTMLButtonElement
const createName = document.getElementById('create-name')! as HTMLInputElement
const createInfinite = document.getElementById('create-infinite')! as HTMLInputElement
const createNInARow = document.getElementById('create-n-in-a-row')! as HTMLInputElement
const createPlayerCount = document.getElementById('create-player-count')! as HTMLInputElement
const createWidth = document.getElementById('create-width')! as HTMLInputElement
const createHeight = document.getElementById('create-height')! as HTMLInputElement

createButton.addEventListener('click', async () => {
    const roomName = createName.value as string;
    const infinite = createInfinite.checked;
    const nInARow = parseInt(createNInARow.value);
    const playerCount = parseInt(createPlayerCount.value);
    const width = parseInt(createWidth.value);
    const height = parseInt(createHeight.value);

    joinGameOverlay.style.display = 'none'
    createGameOverlay.style.display = 'none'
    loadingOverlay.style.visibility = 'visible'

    const result = await (infinite ? create(roomName, nInARow, playerCount, true) : create(roomName, nInARow, playerCount, false, width, height));

    loadingOverlay.style.visibility = '';

    if (typeof result === 'string') {
        console.log(result);
        joinGameOverlay.style.display = '';
        createGameOverlay.style.display = '';
        alert(result);
        return;
    }
    statusOverlay.style.visibility = 'visible'
    console.log('Game started')
    const color = result[0];

    const room = new ClientRoom(roomName, color, nInARow, infinite ? undefined : width, infinite ? undefined : height)

    room.closeCb = () => {
        joinGameOverlay.style.display = '';
        createGameOverlay.style.display = '';
        loadingOverlay.style.visibility = '';
        statusOverlay.style.visibility = '';
    }
})
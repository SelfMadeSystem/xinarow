import './style.scss'

import { OnlineClientRoom } from './OnlineClientRoom';
import { create, join } from './GameHandler';
import { colorName } from '../share/PlayerColor';
import { capitalizeFirst } from '../share/Utils';
import { OfflineClientRoom } from './OfflineClientRoom';

const loadingOverlay = document.getElementById('loading')! as HTMLDivElement;
const joinGameOverlay = document.getElementById('join-game')! as HTMLDivElement
const createGameOverlay = document.getElementById('create-game')! as HTMLDivElement

const statusOverlay = document.getElementById('turn')! as HTMLDivElement

export function setTurnText(turn: number, myTurn: number, teamSize: number) {
    if (turn === myTurn) {
        setStatusText("It's your turn.");
    } else {
        if (teamSize === 1) {
            setStatusText(`${capitalizeFirst(colorName(turn))}'s turn.`);
        } else {
            setStatusText(`${capitalizeFirst(colorName(Math.floor(turn / teamSize)))} #${turn % teamSize + 1}'s turn.`);
        }
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
    const [player, options] = result;
    const { nInARow, teamCount, teamSize, infinite, gravity, skipTurn } = options;

    const width = infinite ? undefined : options.width;
    const height = infinite ? undefined : options.height;

    const room = new OnlineClientRoom(roomName, player, teamCount, teamSize, nInARow, gravity, skipTurn, width, height)

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
const createGravity = document.getElementById('create-gravity')! as HTMLInputElement
const createSkipTurn = document.getElementById('create-skip-turn')! as HTMLInputElement
const createNInARow = document.getElementById('create-n-in-a-row')! as HTMLInputElement
const createTeamCount = document.getElementById('create-team-count')! as HTMLInputElement
const createTeamSize = document.getElementById('create-team-size')! as HTMLInputElement
const createWidth = document.getElementById('create-width')! as HTMLInputElement
const createHeight = document.getElementById('create-height')! as HTMLInputElement
const createOnline = document.getElementById('create-online')! as HTMLInputElement

createButton.addEventListener('click', async () => {
    const roomName = createName.value as string;
    const infinite = createInfinite.checked;
    const gravity = createGravity.checked;
    const skipTurn = createSkipTurn.checked;
    const nInARow = parseInt(createNInARow.value);
    const teamCount = parseInt(createTeamCount.value);
    const teamSize = parseInt(createTeamSize.value);
    const width = parseInt(createWidth.value);
    const height = parseInt(createHeight.value);
    const online = createOnline.checked;

    joinGameOverlay.style.display = 'none'
    createGameOverlay.style.display = 'none'
    loadingOverlay.style.visibility = 'visible'

    const result = online ? await (infinite ? create(roomName, { nInARow, teamCount, teamSize, gravity, skipTurn, infinite }) :
        create(roomName, { nInARow, teamCount, teamSize, gravity, skipTurn, infinite, width, height})) : [0];

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
    const player = result[0];

    const room = new (online ? OnlineClientRoom : OfflineClientRoom)(roomName, player, teamCount, teamSize, nInARow, gravity, skipTurn, infinite ? undefined : width, infinite ? undefined : height)

    room.closeCb = () => {
        joinGameOverlay.style.display = '';
        createGameOverlay.style.display = '';
        loadingOverlay.style.visibility = '';
        statusOverlay.style.visibility = '';
    }
})

export enum AppState {
    TREE = 'TREE',
    EXPLODE = 'EXPLODE'
}

export enum ColorTheme {
    PINK = 'PINK',
    GOLD = 'GOLD',
    BLUE = 'BLUE',
    PURPLE = 'PURPLE'
}

export interface GestureData {
    isActive: boolean;
    x: number;
    y: number;
    isPinching: boolean;
    isThumbUp: boolean;
    fingerCount: number;
    handSize: number;
    handRotation: number;
}

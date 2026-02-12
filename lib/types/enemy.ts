export interface Attack {
    id: number;
    name: string;
    bonus: number;
    damage: string; // e.g. "2d6+3 slashing"
}

export interface Enemy {
    id: number;
    name: string;
    size: string;
    type: string;
    alignment: string;
    challenge_rating: number;
    attacks?: Attack[];
    stats?: {
        hit_points: number;
        armor_class: number;
    };
}

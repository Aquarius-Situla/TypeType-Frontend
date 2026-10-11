import { m } from "../../paraglide/messages.js";

type Credit = readonly [title: string, author: string, source: string];

export type CreditSection = { heading: () => string; credits: readonly Credit[] };

const yt = (id: string): string => `https://www.youtube.com/watch?v=${id}`;

export const MUSIC_CREDITS: CreditSection = {
  heading: m.halloween_credits_music,
  credits: [
    ["Creeping Down", "Feldup", yt("R0aKenL2FGk")],
    ["Sickness", "Feldup", yt("_QpCi4H-5q8")],
    ["11", "C418", yt("9HkHjbW2fn8")],
    ["Ave Maria, 1904 recording", "Alessandro Moreschi", yt("lmI_C-S0Abg")],
    ["Spooky Scary Skeleton Dance Remix", "Nick Rodgers, after Andrew Gold", yt("n_qbGJuxCYY")],
  ],
};

export const VIDEO_CREDITS: CreditSection = {
  heading: m.halloween_credits_videos,
  credits: [
    ["stick bug meme", "gilltum", yt("9BalEldzE8o")],
    ["Stick bug Rick roll", "Slime Ex3", yt("5Cr83DsufZk")],
  ],
};

export const SOUND_CREDITS: CreditSection = {
  heading: m.halloween_credits_sounds,
  credits: [
    ["Old TV static", "CSX2000", yt("J_FVFMdiZ0w")],
    ["Minecraft cave sounds", "Dlo Music", yt("AWHoDg9wRR0")],
    ["Distant metal bang", "The Hollywood Edge", yt("NnN2tqsFTbc")],
    ["Wood door slams", "The Hollywood Edge", yt("yGI7TGCkLK8")],
    ["Flashlight clicks", "The Hollywood Edge", yt("sEQOkbANLWM")],
    ["Violent skin stretch", "The Hollywood Edge", yt("XiiXP_fx0Y8")],
    ["Slow hinges creak", "The Hollywood Edge", yt("io9-RKN6DlA")],
    ["Distant booming metal thud", "Sound Ideas", yt("ICyC8Dj3IKU")],
    ["Stadium light hum", "Sound Library", yt("7KW0c9lUKAw")],
    ["Arena lights switching", "Sounds For Free", yt("OsN6iSBRDHw")],
    ["Arena lights off", "SoundEffectsSFX", yt("hFIPZLtHJ1Y")],
    ["Power outage", "Wellspring Prep Drama", yt("PLJqVJM2mPM")],
    ["1993 Panasonic CRT shutdown", "EllersonStudios", yt("PEuxDo_X_HE")],
    ["Howling wind in a stairwell", "White Noise Jack", yt("DkrrQDB1VVI")],
    ["Stone wall door", "Sound Library", yt("6LUCJMScgaE")],
    ["Fluorescent light startup", "Joethaboss66", yt("XuU9URbFi5I")],
    ["Warehouse lights turning on", "soundfx", yt("T5W5ZCOqJG8")],
    ["Footsteps on tile", "Everyday Cinematic Sounds", yt("U2_l2Cz4HyE")],
    ["Running on tile", "YouTube Audio Library", yt("6d280FaRJx4")],
    ["Soviet Union 1945 EAS alarm", "Sailor moon guy", yt("Nby4CoqqWQU")],
    ["Bone cracking", "Rossman's Crunchy Cracking", yt("pv3keojTdHg")],
    ["Crying newborn", "SOUNDS RECORDED", yt("f7hIz5khVPA")],
    ["Wooden floor creaks", "Wood Sound Effects", yt("7ez1IP4mZCU")],
    ["Body fall", "Free Effects For Clips and Ambient Music and Sound", yt("tDYkBERlG5E")],
    ["Flickering light", "BridgeSound", yt("TOueemiIVYU")],
  ],
};

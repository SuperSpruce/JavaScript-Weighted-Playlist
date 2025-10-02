var audio = document.getElementById("RandomSong");
var volumeSlider = document.getElementById("volumeSlider");
var percentDisplay = document.getElementById("percentage");
var rDisplay = document.getElementById("random");
var nameDisplay = document.getElementById("name");
var weightDisplay = document.getElementById("weight");
var relativeRarityDisplay = document.getElementById("relativeRarity");
var relativeRarityDisplay2 = document.getElementById("relativeRarity2");
var rarityDisplay = document.getElementById("rarity");
var rarityRankDisplay = document.getElementById("rarityRank");
var weightRankDisplay = document.getElementById("weightRank");
var difficultyDisplay = document.getElementById("difficulty");
var playbackRateDisplay = document.getElementById("playbackRate");
var playbackSemitonesDisplay = document.getElementById("playbackSemitones");
var halfSpeedDisplay = document.getElementById("halfSpeedDisplay");

var difficultyColor = document.getElementById("difficultyColor");
var playbackColor = document.getElementById("playbackColor");

var r = 0;
var thresh = 1000000;
var lastTick = Date.now();
var difficulty = 0;
var difficultyID = 0;
var bestTime = 0;
var frames = 0;
var percent = 0;
var mode = 0;
var spread = 1;
var halfSpeed = false;

var m = new MersenneTwister();
var a = -1;
var playbackSpeed = 1.12;

// AudioContext Stuff
/*const audioContext = new AudioContext();
const sourceNode = audioContext.createMediaElementSource(audio);
const gainNode = audioContext.createGain();
sourceNode.connect(gainNode).connect(audioContext.destination);*/

// Start caching songs
/*if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('serviceWorker.js')
    .then(() => console.log('Service Worker registered'))
    .catch(console.error);
}

async function cacheNextTrack(url) {
  if ('caches' in window) {
    const cache = await caches.open('music-cache');
    cache.add(url).catch(err => console.warn("Failed to cache:", url, err));
  }
}*/

// Set initial volume
audio.volume = volumeModifier(volumeSlider.value);

// Update audio volume when the slider value changes
volumeSlider.addEventListener('input', (event) => {
    audio.volume = volumeModifier(event.target.value);
    //gainNode.gain.value = volumeModifier(event.target.value);
});

function volumeModifier(v) {
    rDisplay.innerHTML = v;
    return v*v;
}

function start() {
    if(mode == 0)
        a = songPicker.pick();
    else {
        do {
            a = songPicker.pick();
            console.log(songList[a][0]);
        }
        while(songList[a][2] == 0 && m.random() > mode)
    }
    audio.src = "Music/" + songList[a][0];
    audio.currentTime = 0;
    audio.play();
    setPlaybackSpeed();
    updateUI();
    difficultyID = Number(songList[a][2]);
    if(Number(songList[a][2]) >= 0) {
        difficulty = Number(songList[a][2]);
        console.log(a + "  " + difficulty);
    }
    difficultyDisplay.innerHTML = Math.round(difficulty);
}

audio.addEventListener("ended", function(){
    audio.pause();
    audio.currentTime = 0;
    frames = 0;
    if(mode == 0)
        a = songPicker.pick();
    else {
        do a = songPicker.pick();
        while(songList[a][2] == 0 && m.random() > mode)
    }
    audio.src = "Music/" + songList[a][0];
    console.log("Onto the next track!");
    updateUI();
    audio.play();
    setPlaybackSpeed();
    difficultyID = Number(songList[a][2]);
    console.log(songList[a][0]);
    console.log("  Street Triple weight: " + Number(songList[a][1]));
    if(difficultyID >= 0) {
        difficulty = difficultyID;
    }
    difficultyDisplay.innerHTML = Math.round(difficulty);
});



function setPlaybackSpeed() {
    if(m.random() < 1/11)
        halfSpeed = 1;
    /*else if(m.random() < 10/6)
        halfSpeed = -1;*/
    else {halfSpeed = 0;}
    playbackSpeed = Math.pow(2, inverseStandardNormalCDF(m.random())/12*spread);
    let semitones = (12*Math.log2(playbackSpeed));
    if(halfSpeed == 1) {
        playbackSpeed /= 2;
        audio.preservesPitch = false;
    }
    else if(halfSpeed == -1) {
        playbackSpeed *= 2;
        audio.preservesPitch = true;
        audio.playbackRate = playbackSpeed;
        //audio.preservesPitch = false;
        //playbackSpeed /= 2;
        //audio.playbackRate = playbackSpeed;
    }
    else {
        audio.preservesPitch = false;
    }
    playbackSemitonesDisplay.innerHTML = semitones.toFixed(2);
    let semitoneC = semitones/spread;
    if(Math.abs(semitoneC) > 2.5) {
        let str = "Rare semitone modification! " + semitones.toFixed(2) + " semitones";
        str += halfSpeed == 1 ? ", half speed" : "";
        console.log(str);
    }
    let red = Math.min(221, 221+60*semitoneC);
    let green = Math.min(221, 221-60*Math.abs(semitoneC));
    let blue = Math.min(221, 221-60*semitoneC);
    playbackColor.style.color = `rgb(${red}, ${green}, ${blue})`;
    playbackRateDisplay.innerHTML = playbackSpeed.toFixed(3);
    halfSpeedDisplay.innerHTML = halfSpeed == 1 ? ", half speed" : "";
    //halfSpeedDisplay.innerHTML = halfSpeed == -1 ? ", +1 octave" : "";
    if(halfSpeed >= 0)
        audio.playbackRate = playbackSpeed;
    let modeRR = Number(songList[a][2]) != 0 ? 1 : (mode == 0 ? 1 : 1/mode)
    relativeRarityDisplay2.innerHTML = (modeRR*(halfSpeed?10:1)*1000000/songList[a][1]/Math.exp(-1/2*semitoneC*semitoneC)).toFixed(1);
}



function updateUI() {
    nameDisplay.innerHTML = songList[a][0];
    let weight = songList[a][1];
    let fabledCheck = songList[a][2];
    weightDisplay.innerHTML = numberWithCommas(weight);
    relativeRarityDisplay.innerHTML = (1000000/weight).toFixed(1);
    rarityRankDisplay.innerHTML = (100*(1-getRarityRank2())).toFixed(0);
    percentDisplay.innerHTML = 0;
    if(fabledCheck == -99) {rarityDisplay.innerHTML = "Fabled"; rarityDisplay.style.color = `rgb(255, 55, 155)`;}
    else if(weight > 200000) {rarityDisplay.innerHTML = "Common"; rarityDisplay.style.color = `rgb(221, 221, 221)`;}
    else if(weight > 80000) {rarityDisplay.innerHTML = "Uncommon"; rarityDisplay.style.color = `rgb(100, 220, 100)`;}
    else if(weight > 30000) {rarityDisplay.innerHTML = "Rare"; rarityDisplay.style.color = `rgb(80, 100, 240)`;}
    else if(weight > 10000) {rarityDisplay.innerHTML = "Epic"; rarityDisplay.style.color = `rgb(150, 30, 250)`;}
    else if(weight > 2000) {rarityDisplay.innerHTML = "LEGENDARY"; rarityDisplay.style.color = `rgb(255, 100, 0)`;}
    else {rarityDisplay.innerHTML = "MYTHICAL";}
    let weightRankD = getWeightRank();
    if(weightRankD > 0.1) {weightRankDisplay.innerHTML = (100*(1-getWeightRank())).toFixed(0);}
    else if(weightRankD > 0.01) {weightRankDisplay.innerHTML = (100*(1-getWeightRank())).toFixed(1);}
    else if(weightRankD > 0.001) {weightRankDisplay.innerHTML = (100*(1-getWeightRank())).toFixed(2);}
    else {weightRankDisplay.innerHTML = (100*(1-getWeightRank())).toFixed(3);}
}

function setDifficultyColor() {
    let red = Math.min(255, 221+difficulty/50);
    let green = Math.max(0, 221-Math.pow(difficulty, 3/4));
    let blue = Math.max(0, Math.min(255, 221-difficulty+difficulty*difficulty/10000));
    difficultyColor.style.color = `rgb(${red}, ${green}, ${blue})`;
}

function formatCommas(number) {
    let millions = Math.floor(number/1e6);
    let thousands = Math.floor((number-1e6*millions)/1e3);
    let ones = Math.floor(number-1e3*thousands);
    if(number > 1e6) return millions + "," + thousands + ", " + ones;
    else if(number > 1e3) return thousands + ", " + ones;
    else return number;
}
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


function runAttempt() {
    if(a == -1) return;
    frames++;
    if(songList[a][1] <= 2000) {
        let red = 127*(1+Math.sin(frames/48));
        let green = 127*(1+Math.sin((frames+100)/48));
        let blue = 127*(1+Math.sin((frames+201)/48));
        rarityDisplay.style.color = `rgb(${red}, ${green}, ${blue})`;
    }
    if(audio.paused) {
        audio.play();
        audio.playbackRate = playbackSpeed;
    }
    let elapsed = Date.now() - lastTick;
    lastTick = Date.now();
    r = m.random() * (thresh + difficulty*playbackSpeed*elapsed/10);
    let prevDiff = difficulty;
    if(r > thresh) {
        audio.pause();
        audio.currentTime = 0;
        frames = 0;
        if(mode == 0)
            a = songPicker.pick();
        else {
            do a = songPicker.pick();
            while(songList[a][2] == 0 && m.random() > mode)
        }
        audio.src = "Music/" + songList[a][0];
        if(difficultyID != -10) difficultyID = songList[a][2];
        console.log("You died in the level!");
        updateUI();
        audio.play();
        setPlaybackSpeed();
        console.log((Number(prevDiff)).toFixed(0) + "cc wheelies  " + percent + "% " + difficultyID);
        if(difficultyID >= 0) {
            difficulty = difficultyID;
        }
        console.log(songList[a][0]);
        console.log("  Street Triple weight: " + Number(songList[a][1]));
    }
    if(difficultyID < 0 && difficultyID != -99) {
        difficulty = calculateDifficulty(difficultyID*-1);
        percentDisplay.innerHTML = percent;
    }
    else if(difficultyID == 0 || difficultyID == -99) {
        percent = (100*audio.currentTime / audio.duration).toFixed(0);
        percentDisplay.innerHTML = percent;
    }
    else {
        percent = Math.min(100,(100*audio.currentTime / (audio.duration-3))).toFixed(0);
        percentDisplay.innerHTML = percent;
    }
    //percentDisplay.innerHTML = Math.floor(audio.currentTime / 2.187);
    //rDisplay.innerHTML = Math.floor(r);
    if(prevDiff != difficulty) difficultyDisplay.innerHTML = Math.round(difficulty);
    setDifficultyColor();
}

// Main loop, runs 50 times per second
setInterval(runAttempt, 20);


function calculateDifficulty(id) {
    let c = audio.currentTime;
    if(id == 11) { // Map Bloodbath in Reverse to Bloodbath's difficulty
        id = 102;
        c += 81;
    }
    switch(id) {
        case 1: // Stereo Madness
            percent = Math.min(100, Math.max(0, c*100/84)).toFixed(0);
            if(c > 1.5 && c <= 1.6) return 250;
            else if(c > 3.0 && c <= 3.1) return 100;
            else if(c > 4.5 && c <= 6.0) return 25;
            else if(c > 7.5 && c <= 7.6) return 50;
            else if(c > 9 && c <= 22.5) return 10;
            else if(c > 22.5 && c <= 22.6) return 150;
            else if(c > 26 && c <= 38) return 1;
            else if(c > 38 && c <= 49.5) return 8;
            else if(c > 49.5 && c < 84) {
                if(c > 55 && c <= 55.5 || c > 67 && c <= 67.5) return 200;
                else if(c > 73.5) return 3;
                else return 16;
            }
            else return 0;
        case 2: // Can't Let Go
            percent = Math.min(100, Math.max(0, c*100/81)).toFixed(0);
            if(c < 24) return 18;
            else if(c < 46.7) return 20;
            else if(c < 58) return 14;
            else if(c < 69.2) return 30;
            else if(c < 80) return 24;
            else return 0;
        case 3: // Electrodynamix
            percent = Math.min(100, Math.max(0, c*100/81.5)).toFixed(0);
            if(c < 6) return 20;
            else if(c > 8 && c < 37.5) return 100;
            else if(c >= 37.5 && c < 53) return 50;
            else if(c >= 53 && c < 81) {
                if(c > 60.5 && c < 64.5) return 200;
                else return 150;
            }
            else return 0;
        case 4: // Clubstep
            percent = Math.min(100, Math.max(0, c*100/87)).toFixed(0);
            if(c < 20) {
                if(c > 2) return 100;
                else if(c > 1.5 && c <= 1.6) return 200;
                else return 0;
            }
            else if(c > 23 && c <= 30) return 210;
            else if(c > 30 && c <= 45) return 140;
            else if(c > 45 && c <= 50) return 280;
            else if(c > 50 && c <= 56) return 140;
            else if(c > 56 && c <= 69) return 210;
            else if(c > 69 && c <= 72) return 300;
            else if(c > 72 && c <= 78) return 210;
            else if(c > 78 && c <= 83) return 350;
            else if(c > 83 && c <= 86) return 280;
            else return 0;
        case 5: // ToE2
            percent = Math.min(100, Math.max(0, c*100/90)).toFixed(0);
            if(c <= 12) return 72;
            else if(c <= 15.5) return 288;
            else if(c <= 33.5) return 180;
            else if(c <= 48) return 90;
            else if(c <= 59) return 135;
            else if(c <= 62) return 405;
            else if(c <= 65 || c > 89) return 0;
            else if(c <= 72) return 60;
            else if(c <= 75.5) return 720;
            else return 234;
        case 6: // Deadlocked
            percent = Math.min(100, Math.max(0, c*100/100.5)).toFixed(0);
            if(c <= 14.5) return 100;
            else if(c <= 18) return 500;
            else if(c <= 21.5) return 250;
            else if(c <= 57) return 200;
            else if(c <= 64) return 300;
            else if(c <= 71.5) return 200;
            else if(c <= 79) return 500;
            else if(c <= 85.5) return 300;
            else if(c <= 92.5) return 200;
            else if(c <= 99.5) return 100;
            else return 0;
        case 7: // Jawbreaker
            percent = Math.min(100, Math.max(0, c*100/61.7)).toFixed(0);
            if(c < 8.8) return 110;
            else if(c < 17.2) return 330;
            else if(c < 24) return 10;
            else if(c < 26 || c > 61) return 0;
            else return 770;
        case 8: // TheFatRat: Windfall (Evil Flowers)
            percent = Math.min(100, Math.max(0, (c-21)/85*100)).toFixed(0);
            if(c < 21) {audio.currentTime = 21; return 0;}
            else if(c >= 22 && c < 22.1) return 1000;
            else if(c >= 22.5 && c < 57) return 200+2*c;
            else if(c >= 58 && c < 58.1) return 500;
            else if(c >= 60 && c < 69) return 380;
            else if(c >= 69 && c < 78.2) return 420;
            else if(c >= 85.4 && c < 97.2) return 50*c-4000;
            else if(c >= 99.9 && c < 100) return 50;
            else if(c >= 104.9 && c < 105) return 2000;
            else return 0;
        case 9: // Sonic Wave
            percent = Math.min(100, Math.max(0, c*100/121.8)).toFixed(0);
            if(c < 13.2) return 350;
            else if(c < 26.4) return 650;
            else if(c < 39.6) return 20*c;
            else if(c < 66.2) return 1100;
            else if(c < 79.4) return 900;
            else if(c < 92.6) return 450;
            else if(c < 105.8) return 20*c-1400;
            else if(c < 107.6) return 0;
            else if(c < 114.2) return 1200;
            else if(c < 117.6) return 1000;
            else if(c < 119) return 1200;
            else if(c < 120) return 1400;
            else if(c < 120.8) return 1600;
            else return 0;
        case 10: // At the speed of light, split into 101, 102, 103
            let picker = (Math.round(r) % 10);
            if(picker < 2.5) {
                difficultyID = -101;
                nameDisplay.innerHTML = "Cataclysm.mp3";
            }
            else if(picker < 7.5) {
                difficultyID = -102; 
                audio.currentTime = 81;
                nameDisplay.innerHTML = "Bloodbath.mp3";
            }
            else {
                difficultyID = -103; 
                audio.currentTime = 75;
                nameDisplay.innerHTML = "Bloodlust.mp3";
            }
            console.log("Once " + difficultyID);
            return 0;
        case 12: // GD Galaxy Collapse
            percent = Math.min(100, Math.max(0, c*100/219.7)).toFixed(0);
            if(c < 0.7) return 0;
            else if(c < 7) return  400;
            else if(c < 13.8) return  500;
            else if(c < 20.6) return  600;
            else if(c < 27.4) return  700;
            else if(c < 31) return  0;
            else if(c < 58) return  1000;
            else if(c < 69.5) return  450;
            else if(c < 90) return  15*c - 500; 
            else if(c < 93) return  0;
            else if(c < 141.6) return  1400;
            else if(c < 155) return 350;
            else if(c < 162) return 650;
            else if(c < 165.5) return 750;
            else if(c < 168.3) return 10*c-800;
            else if(c < 171.5) return 0;
            else if(c < 196) return 1400;
            else if(c < 216.1) return 1600;
            else if(c < 217.4) return 2500;
            else if(c < 218) return 5000;
            else if(c < 218.7) return 10000;
            else return 0;
        case 13: // 454 Galaxy Collapse
            percent = Math.min(100, Math.max(0, c*100/295.5)).toFixed(0);
            if(c > 295.5) return 0;
            else if(c < 18) return 10;
            else if(c < 18.5) return 10000;
            else if(c < 57.5) return 10;
            else if(c < 58) return 6000;
            else if(c < 61) return 600;
            else if(c < 61.5) return 3000;
            else if(c < 88) return 1;
            else if(c < 88.5) return 10000;
            else if(c < 102.5) return 0;
            else if(c < 125.5) {
                if(c > 108 && c <= 109) return 4000;
                else if(c > 118 && c <= 119) return 2000;
                else return 150;
            }
            else if(c < 129) return 0;
            else if(c < 129.2) return 40000;
            else if(c < 168.7) return 100;
            else if(c < 169.2) return 10000;
            else if(c < 176) return 0;
            else if(c < 196.5) return 50;
            else if(c < 197.5) return 5000;
            else if(c < 204.5) return 150;
            else if(c < 205) return 15000;
            else if(c < 214) return 0;
            else if(c < 222.7) return 25;
            else if(c < 223.2) return 1000;
            else if(c < 241.5) return 40;
            else if(c < 242) return 14000;
            else if(c < 251) return 0;
            else if(c < 252) return 168;
            else if(c < 262.9) return 42;
            else if(c < 263) return 10000;
            else if(c < 266) return 84;
            else if(c < 267) return 3000;
            else if(c < 269) return 0;
            else if(c < 273) return 1000;
            else if(c < 287.5) return 28;
            else if(c < 288) return 2000;
            else if(c < 291) return 0;
            else if(c < 293) return 1000;
            else if(c < 293.5) return 200;
            else return 1000;
        case 14: // BOMBA drop
            percent = Math.min(100, Math.max(0, c*100/59)).toFixed(0);
            if(c < 59) return 200+5*Math.pow(c, 1.25);
            else return 0;
        case 15: // Black Blizzard
            percent = Math.min(100, c*100/188).toFixed(0);
            return 100 + 5000/(c+2);
        case 16: // Train Rush
            percent = Math.min(100, c*100/293).toFixed(0);
            return 50 + c/3;
        case 17: // Artificial Ascent
            percent = Math.min(100, c*100/143).toFixed(0);
            if(c < 10) return 100;
            else if(c < 11) return 1000;
            else if(c < 20) return 300;
            else if(c < 30.5) return 400;
            else if(c < 35.5) return 320;
            else if(c < 40.5) return 550;
            else if(c < 45.5) return 750;
            else if(c < 50.5) return 636;
            else if(c < 55.5) return 250;
            else if(c < 60.5) return 350;
            else if(c < 61) return 1000;
            else if(c < 66) return 450;
            else if(c < 71) return 600;
            else if(c < 81) return 2*c;
            else if(c < 91) return 3*c;
            else if(c < 101) return 4*c;
            else if(c < 111) return 5*c;
            else if(c < 121) return 1000-5*c;
            else if(c < 142) return c*c/40;
            else return 0;
        case 99: // Fabled check, not a difficulty related thing
            return 0;
        case 101: // Cataclysm
            percent = Math.min(100, Math.max(0, c*100/77.2)).toFixed(0);
            if(c < 6) return 120;
            else if(c < 11.6) return 1200;
            else if(c < 14.5) return 0;
            else if(c < 38.5) return 800;
            else if(c < 50.5) return 600;
            else if(c < 62) return 1600;
            else if(c < 74) return 160;
            else if(c < 76.5 && c >= 76) return 2000;
            else return 0;
        case 102: // Bloodbath
            percent = Math.min(100, Math.max(0, (c-81)/112.3*100)).toFixed(0);
            if(c < 82) return 0;
            else if(c < 89) return 600;
            else if(c < 92) return 540;
            else if(c < 97.5) return 600;
            else if(c < 106.5) return 420;
            else if(c < 109.5) return 0;
            else if(c < 121.5) return 750;
            else if(c < 133.5) return 450;
            else if(c < 145) return 780;
            else if(c < 157) return 5*c-350;
            else if(c < 160) return 0;
            else if(c < 167) return 720;
            else if(c < 168) return 1790;
            else if(c < 191) return 10*c-1100;
            else if(c >= 192 && c < 192.5) return 1800;
            else return 0;
        case 103: // Bloodlust
            percent = Math.min(100, Math.max(0, (c-75)/168.3*100)).toFixed(0);
            if(c < 76) return 0;
            else if(c < 81) return 900;
            else if(c < 89) return 600;
            else if(c < 92) return 360;
            else if(c < 97.5) return 600;
            else if(c < 106.5) return 420;
            else if(c < 109.5) return 0;
            else if(c < 121.5) return 750;
            else if(c < 133.5) return 450;
            else if(c < 145) return 780;
            else if(c < 157) return 8*c-900;
            else if(c < 160) return 0;
            else if(c < 167) return 720;
            else if(c < 168) return 790;
            else if(c < 192) return 9*c-1000;
            else if(c < 195.6) return 0;
            else if(c < 231) return 3*c;
            else if(c < 240.5) return 480;
            else if(c < 241) return 4800;
            else if(c >= 242 && c < 242.5) return 2400;
            else return 0;
    }
}
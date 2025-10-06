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
var currentSongID = -1;
var nextSongID = -1;
var playbackSpeed = 1.12;

var currentDuration = -1;
var currentTime = 0;
var startTime = 0;
var pauseTime = 0;
var isPlaying = false;
var buffering = false;

// AudioContext Stuff
let audioContext; // = new AudioContext();
let sourceNode = null; // = audioContext.createMediaElementSource(audio);
let gainNode; // = audioContext.createGain();
let buffer1 = null;
let loadingPromise = null;


// Set initial volume
audio.volume = volumeModifier(volumeSlider.value);

// Update audio volume when the slider value changes
volumeSlider.addEventListener('input', (event) => {
    //audio.volume = volumeModifier(event.target.value);
    gainNode.gain.value = volumeModifier(event.target.value);
});

function volumeModifier(v) {
    rDisplay.innerHTML = (100*Number(v)).toFixed(0) + "%";
    return v*v;
}

async function loadTrack(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

async function preloadNextTrack(songID) {
    // if already loading, return that
    if (loadingPromise) return loadingPromise;

    buffering = true;
    const song = songList[songID];
    loadingPromise = loadTrack("Music/" + song[0])
        .then(buf => {
            buffer1 = buf;
            buffering = false;
            loadingPromise = null;
            return buf;
        })
        .catch(err => {
            buffering = false;
            loadingPromise = null;
            throw err;
        });

    return loadingPromise;
}

async function playTrack(buffer) {
    if(sourceNode) {
        try { sourceNode.stop(); } catch (e) {}
        sourceNode.disconnect();
        sourceNode = null;
    }
    const node = audioContext.createBufferSource();
    node.buffer = buffer;
    node.playbackRate.value = setPlaybackSpeed();
    node.connect(gainNode);
    currentDuration = buffer.duration / node.playbackRate.value;

    node.onended = async () => {
        if (node === sourceNode) {
            sourceNode = null; // mark this one as finished
            await skipToNextTrack();
        }
    };

    let offset = 0;
    //console.log(difficultyID);
    if(difficultyID == -8) {
        offset = 21;
    }
    else if(difficultyID == -10) {
        offset = cataclysmBloodbathBloodlust();
    }
    sourceNode = node;
    startTime = Date.now();
    node.start(0, offset);
}

async function skipToNextTrack() {
    if (sourceNode) {
        try { sourceNode.stop(); } catch (e) {
            console.warn("Failed to stop the source node!", e);
        }
        sourceNode.disconnect();
        sourceNode = null;
    }

    currentSongID = nextSongID;

    // make sure the next buffer is ready
    if (!buffer1 && loadingPromise) {
        console.log("Waiting for preload to finish...");
        await loadingPromise;
    }

    const buffer = buffer1;
    buffer1 = null;
    if (!buffer) {
        console.warning("Buffer still null after waiting — skipping track!");
        return;
    }

    console.log("Onto the next track!");
    frames = 0;
    difficultyID = Number(songList[currentSongID][2]);
    console.log(songList[currentSongID][0]);
    //console.log("  Street Triple weight: " + Number(songList[currentSongID][1]));
    if(difficultyID >= 0) {
        difficulty = difficultyID;
    }
    difficultyDisplay.innerHTML = Math.round(difficulty);

    updateUI();
    await playTrack(buffer);

    nextSongID = pickSongs(1)[0];
    await preloadNextTrack(nextSongID);
}

function pickSongs(num = 1) {
    var tracks = [];
    for(let i=0; i<num; i++) {
        if(mode == 0)
        currentSongID = songPicker.pick();
        else {
            do currentSongID = songPicker.pick();
            while(songList[currentSongID][2] == 0 && m.random() > mode)
        }
        tracks.push(currentSongID);
    }
    return tracks;
}

async function start() {
    if(sourceNode) {
        sourceNode.stop();
        sourceNode = null;
    }
    if(!audioContext) {
        audioContext = new AudioContext();
        sourceNode = audioContext.createMediaElementSource(audio);
        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        if(workoutMode) {
            spread /= 2;
            songPicker = setSongPicker(songList);
            sortedSongs = returnSortedOptions(songPicker.options);
            console.log("Enabling workout mode!");
        }
    }

    let firstSongs = pickSongs(2);
    currentSongID = firstSongs.pop();
    let firstSong = songList[currentSongID];

    console.log("Music/" + firstSong[0]);
    const firstBuffer = await loadTrack("Music/" + firstSong[0]);
    difficultyID = Number(firstSong[2]);
    if(Number(firstSong[2]) >= 0) {
        difficulty = Number(firstSong[2]);
        console.log(currentSongID + "  " + difficulty);
    }
    difficultyDisplay.innerHTML = Math.round(difficulty);
    playTrack(firstBuffer);
    updateUI();

    nextSongID = firstSongs.pop();
    await preloadNextTrack(nextSongID);
}

async function startWorkout() {
    workoutMode = true;
    start();
}

function stop() {
    sourceNode.stop();
    sourceNode = null;
    gainNode = null;
    audioContext = null;
}



function setPlaybackSpeed() {
    if(m.random() < 1/11 && !workoutMode)
        halfSpeed = 1;
    else if(m.random() > 255/256) {
        halfSpeed = -1;
    }
    else {halfSpeed = 0;}
    playbackSpeed = Math.pow(2, inverseStandardNormalCDF(m.random())/12*spread);
    let semitones = (12*Math.log2(playbackSpeed));
    let addendumStr = "";
    let rarityModifier = 1;
    if(halfSpeed == 1) {
        playbackSpeed /= 2;
        addendumStr = ", half speed";
        rarityModifier = 10;
    }
    else if(halfSpeed == -1) {
        playbackSpeed *= 2;
        addendumStr = ", double speed!";
        rarityModifier = 255;
    }
    audio.preservesPitch = false;
    playbackSemitonesDisplay.innerHTML = semitones.toFixed(2);
    let semitoneC = semitones/spread;
    if(Math.abs(semitoneC) > 2.5) {
        let str = "Rare semitone modification! " + semitones.toFixed(2) + " semitones";
        str += addendumStr;
        console.log(str);
    }
    let red = Math.min(221, 221+60*semitoneC);
    let green = Math.min(221, 221-60*Math.abs(semitoneC));
    let blue = Math.min(221, 221-60*semitoneC);
    playbackColor.style.color = `rgb(${red}, ${green}, ${blue})`;
    playbackRateDisplay.innerHTML = playbackSpeed.toFixed(3);
    halfSpeedDisplay.innerHTML = addendumStr;
    let modeRR = Number(songList[currentSongID][2]) != 0 ? 1 : (mode == 0 ? 1 : 1/mode)
    relativeRarityDisplay2.innerHTML = (modeRR*rarityModifier*1000000/getModifiedWeight()/Math.exp(-1/2*semitoneC*semitoneC)).toFixed(1);
    return playbackSpeed;
}



function updateUI() {
    nameDisplay.innerHTML = difficultyID < -100 ? nameDisplay.innerHTML : songList[currentSongID][0];
    let weight = songList[currentSongID][1];
    if(workoutMode) {
        weight *= songList[currentSongID][3] / 10;
        weight = Math.floor(weight);
    }
    console.log("Street Triple weight: " + weight);
    let fabledCheck = songList[currentSongID][2];
    let workoutModifer = workoutMode ? 2/5 : 1;
    weightDisplay.innerHTML = numberWithCommas(weight);
    relativeRarityDisplay.innerHTML = (1000000/weight).toFixed(1);
    rarityRankDisplay.innerHTML = (100*(1-getRarityRank2())).toFixed(0);
    percentDisplay.innerHTML = 0;
    if(fabledCheck == -99) {rarityDisplay.innerHTML = "Fabled"; rarityDisplay.style.color = `rgb(255, 55, 155)`;}
    else if(weight > 200000 * workoutModifer) {rarityDisplay.innerHTML = "Common"; rarityDisplay.style.color = `rgb(221, 221, 221)`;}
    else if(weight > 80000 * workoutModifer) {rarityDisplay.innerHTML = "Uncommon"; rarityDisplay.style.color = `rgb(100, 220, 100)`;}
    else if(weight > 30000 * workoutModifer) {rarityDisplay.innerHTML = "Rare"; rarityDisplay.style.color = `rgb(80, 100, 240)`;}
    else if(weight > 10000 * workoutModifer) {rarityDisplay.innerHTML = "Epic"; rarityDisplay.style.color = `rgb(150, 30, 250)`;}
    else if(weight > 2000 * workoutModifer) {rarityDisplay.innerHTML = "LEGENDARY"; rarityDisplay.style.color = `rgb(255, 100, 0)`;}
    else {rarityDisplay.innerHTML = "MYTHICAL";}
    let weightRankD = getWeightRank();
    if(weightRankD > 0.1) {weightRankDisplay.innerHTML = (100*(1-weightRankD)).toFixed(0);}
    else if(weightRankD > 0.01) {weightRankDisplay.innerHTML = (100*(1-weightRankD)).toFixed(1);}
    else if(weightRankD > 0.001) {weightRankDisplay.innerHTML = (100*(1-weightRankD)).toFixed(2);}
    else {weightRankDisplay.innerHTML = (100*(1-weightRankD)).toFixed(3);}
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
    if(currentSongID == -1) return;
    frames++;
    if(songList[currentSongID][1] <= 2000) {
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
        console.log((Number(prevDiff)).toFixed(0) + "cc wheelies  " + percent + "% ");
        r = 1;
        skipToNextTrack();
    }
    currentTime = (Date.now() - startTime) / 1000;
    if(difficultyID < 0 && difficultyID != -99) {
        difficulty = calculateDifficulty(difficultyID*-1);
        percentDisplay.innerHTML = percent;
    }
    else if(difficultyID == 0 || difficultyID == -99) {
        difficulty = 0;
        percent = (100*currentTime / currentDuration).toFixed(0);
        percentDisplay.innerHTML = percent;
    }
    else {
        percent = Math.min(100,(100*currentTime / (currentDuration-3))).toFixed(0);
        percentDisplay.innerHTML = percent;
    }
    if(prevDiff != difficulty) difficultyDisplay.innerHTML = Math.round(difficulty);
    setDifficultyColor();
}

// Main loop, runs 50 times per second
setInterval(runAttempt, 20);


function calculateDifficulty(id) {
    let c = currentTime * playbackSpeed;
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
            c = currentTime * playbackSpeed + 21;
            percent = Math.min(100, Math.max(0, (c-21)/85*100)).toFixed(0);
            if(c < 21) {currentTime = 21; return 0;}
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
            //cataclysmBloodbathBloodlust();
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
            c = currentTime * playbackSpeed + 81;
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
            c = currentTime * playbackSpeed + 75;
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


function cataclysmBloodbathBloodlust() {
    let ofs = 0;
    if(difficultyID == -10) {
        let picker = (Math.round(r) % 10);
        if(picker < 2.5) {
            difficultyID = -101;
            nameDisplay.innerHTML = "Cataclysm.mp3";
        }
        else if(picker < 7.5) {
            difficultyID = -102; 
            ofs = 81;
            nameDisplay.innerHTML = "Bloodbath.mp3";
        }
        else {
            difficultyID = -103; 
            ofs = 75;
            nameDisplay.innerHTML = "Bloodlust.mp3";
        }
        console.log("Once " + difficultyID);
    }
    return ofs;
}
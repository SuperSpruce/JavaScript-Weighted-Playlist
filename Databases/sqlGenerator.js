var databaseActive = true;
const sessionID = Math.round(Date.now());
var trackNum = 0;
var dbPlaybackInfo = [0, 0, 0];

let sqlBuffer = localStorage.getItem("songBuffer") || "INSERT INTO PlaylistLog VALUES\n";

function addSQLiteLine(csi, p, d) {
    trackNum++;
    var s = "(";
    s += sessionID + ", ";
    s += trackNum + ", ";
    s += "\"" + songList[csi][0].slice(0, -4) + "\", ";
    s += songList[csi][1] + ", ";
    for(let i=0; i<3; i++) {
        s += dbPlaybackInfo[i] + ", ";
    }
    if(d > 0)
        s += Math.min(p, 100) + ", " + d;
    else 
        s += "NULL, NULL";
    s += "),\n";

    sqlBuffer += s;
    localStorage.setItem("songBuffer", sqlBuffer); // persists instantly

    if(sqlBuffer.length > 4194304) {
        downloadSQL();  // save current data
        sqlBuffer = "INSERT INTO PlaylistLog VALUES\n";
        localStorage.removeItem("songBuffer");
    }
}

function downloadSQL() {
    const blob = new Blob([sqlBuffer.slice(0, -2)], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    let isostr = (new Date).toISOString().slice(0, -8);
    a.download = "songs_log_" + isostr + ".sql";
    a.click();
    URL.revokeObjectURL(a.href);
}

/*function loadDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("MusicPlaybackDB", 1);

        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}*/
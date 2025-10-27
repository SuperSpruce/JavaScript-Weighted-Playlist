var workoutMode = false;

class WeightedRandomPicker {
    constructor(options, mode = 0) {
      this.options = options;
      this.names = [];
      this.cumulativeWeights = [];
      this.totalWeight = 0;
  
      // Calculate cumulative weights
      for (let option of options) {
        this.totalWeight += option.weight;
        this.cumulativeWeights.push(this.totalWeight);
      }
    }
  
    pick() {
      // Generate a random number between 0 and totalWeight
      const random = m.random() * this.totalWeight;
  
      // Use binary search to find the option
      let low = 0;
      let high = this.cumulativeWeights.length - 1;
  
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (random < this.cumulativeWeights[mid]) {
          high = mid;
        } else {
          low = mid + 1;
        }
      }
  
      return this.options[low].option;
    }
}


function readCSV(input) {
  const rows = input.trim().split('\n');
  const output = [];

  for (const row of rows) {
      const columns = row.split(':').map(col => col.trim());
      columns[1] = Number(columns[1]);
      output.push(columns);
  }
  return output;
}

function setSongPicker(songlist) {
    let a = [];
    let temp;
    let indivWeight;
    for(let i=0; i<songlist.length; i++) {
      if(workoutMode) {
        if(songList[i][3] == 0)
          continue;
        indivWeight = Math.floor(songList[i][1] * songList[i][3] / 10);
      }
      else 
        indivWeight = songList[i][1];
      temp = {option: i, names: songlist[i][0], weight: indivWeight, diff: songlist[i][2]};
      a.push(temp);
    }
    let b = new WeightedRandomPicker(a);
    return b;
}


function returnSortedOptions(aa) {
  let arr = [];
  for(let i=0; i<aa.length; i++) {
    arr.push([aa[i].weight, 0, aa[i].names]);
  }
  arr.sort((a, b) => a[0] - b[0]);
  let tWeight = 0;
  for(let i=0; i<aa.length; i++) {
    tWeight += arr[i][0]
    arr[i][1] = tWeight;
  }
  return arr;
}


function returnFrequencyData(rarityData = [2000, 10000, 30000, 80000, 200000, 1e308]) {
  let data = [];
  let sorted = returnSortedOptions(songPicker.options);
  let sCount = 0;
  let wCount = 0;
  let rIndex = 0;
  for(let i=0; i<sorted.length; i++) {
    if(sorted[i][0] > rarityData[rIndex]) {
      data.push([sCount, wCount, wCount/songPicker.totalWeight, songPicker.totalWeight/wCount]);
      sCount = wCount = 0;
      rIndex++;
	  i--;
	  continue;
    }
	sCount++;
	wCount += sorted[i][0];
  }
  data.push([sCount, wCount, wCount/songPicker.totalWeight, songPicker.totalWeight/wCount]);
  return data;
}


function getModifiedWeight() {
  let weight = songList[currentSongID][1];
  if(workoutMode)
    weight = Math.floor(weight * songList[currentSongID][3] / 10);
  return weight;
}


function getRarityRank() {
  // Use binary search to find the song
  let low = 0;
  let high = sortedSongs.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    let weight = getModifiedWeight();
    if (weight < sortedSongs[mid][0]) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  return low - 1;
}

function getRarityRank2() {
  return getRarityRank() / sortedSongs.length;
}

function getWeightRank() {
  // Use binary search to find the song
  let low = 0;
  let high = sortedSongs.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    let weight = getModifiedWeight();
    if (weight < sortedSongs[mid][0]) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  return sortedSongs[low-1][1] / songPicker.totalWeight;
}

function getWeightGini() {
  let g1 = g2 = 0;
  let n = sortedSongs.length;
  for(let i=0; i<n; i++) {
    g1 += (i-1)*sortedSongs[i][0];
    g2 += 1*sortedSongs[i][0];
  }
  return 2*g1/(n*g2) - (n+1)/n;
}

function getRarityGini() {
  let g1 = g2 = 0;
  let n = sortedSongs.length;
  for(let i=0; i<n; i++) {
    g1 += (n-i)/sortedSongs[i][0];
    g2 += 1/sortedSongs[i][0];
  }
  return 2*g1/(n*g2) - (n+1)/n;
}



function inverseStandardNormalCDF(p) {
  if (p < 0 || p > 1) {
      throw new Error('p must be between 0 and 1');
  }

  if (p === 0) return -Infinity;
  if (p === 1) return Infinity;
  if (p === 0.5) return 0;

  const a1 = -39.6968302866538, a2 = 220.946098424521, a3 = -275.928510446969;
  const a4 = 138.357751867269, a5 = -30.6647980661472, a6 = 2.50662827745924;
  const b1 = -54.4760987982241, b2 = 161.585836858041, b3 = -155.698979859887;
  const b4 = 66.8013118877197, b5 = -13.2806815528857;
  const c1 = -0.00778489400243029, c2 = -0.322396458041136, c3 = -2.40075827716184;
  const c4 = -2.54973253934373, c5 = 4.37466414146497, c6 = 2.93816398269878;
  const d1 = 0.00778469570904146, d2 = 0.32246712907004, d3 = 2.445134137143;
  const d4 = 3.75440866190742;

  let q, r;

  if (p < 0.02425) {
      // Rational approximation for lower region
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
             ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else if (p <= 0.97575) {
      // Rational approximation for central region
      q = p - 0.5;
      r = q * q;
      return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
             (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  } else {
      // Rational approximation for upper region
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
              ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }
}

const songList = readCSV(songWeights);
var songPicker = setSongPicker(songList);
var sortedSongs = returnSortedOptions(songPicker.options);
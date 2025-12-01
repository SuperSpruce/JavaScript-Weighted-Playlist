# JavaScript-Weighted-Playlist
I am releasing to the public the inner workings of my treasured JavaScript Weighted Playlist. (But not the music, of course!)

## Weighted playlist? What?
In a weighted playlist, all songs have a weight that determines how often it will be played. For an example, let's have a playlist with 2 songs. Song A has a weight of 1 and song B has a weight of 3. The sum of weights is 4. Song A has a 1/4 chance of playing, and song B has a 3/4 chance of playing. Because each "roll" is random and independent, the same song can play twice (or more!) in a row.

To make the playlist even more random, the playback speed of each song is randomized. The mean playback rate is its usual playback rate, but the standard deviation is the "spread", defaulting to 1 semitone for normal mode and 0.5 for workout mode. Additionally, each song has a 1/11 chance to have its playback speed halved (excluding in workout mode), and a 1/256 chance to have its playback speed doubled. The playback speed and semitones are displayed on the screen.

Workout mode? Yep, you can use the playlist in two separate ways, one for normal playback, and one to help you push your boundaries in the gym (or something else). It's simply an alternate combination of weights. 

For even more randomness, some songs have a "difficulty"! Simulate someone trying to beat a Geometry Dash level using this mechanic! The instantaneous chance to "die", or skip to the next song, is [difficulty]/10000 per second.

## How to use
There is a file called music.js, that contains a sample list of all music in the playlist. The format goes like this:
`filename:weight:difficultyID:workoutModeMult`

Filename is the name of the music file in the Music folder.

Weight is the weight of that song. Please use positive integers for this value. The sum of all weights should be under 9,000,000,000,000,000. If you somehow need bigger numbers, make a fork of this PR. (For comparison, the sample's sum of all weights is 130,000,000, or about 1 weight for each person in Mexico.)

difficultyID sets the difficulty ID of the song. If the number is positive, the difficulty is set to that constant number. If the number is zero, there will be no difficulty. If the number is negative, it will get a custom difficulty, seen in attempts2.js, based on how far in the song it is. Note that some ID's can even be split into multiple, like simulating Cataclysm, Bloodbath, and Bloodlust with just Dimrain47-AtTheSpeedOfLight.mp3.

workoutModeMult multiplies the weight by 0.1*workoutModeMult. Note that the weights will be rounded to an integer.

## Default rarities
Common: Over 200,000 weight

Uncommon: 80,001-200,000 weight

Rare: 30,001-80,000 weight

Epic: 10,001-30,000 weight

Legendary: 2,001-10,000 weight

Mythical: 2,000 or less weight

Values multiplied by 0.4 for workout mode

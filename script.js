/* =========================================================
   BIRTHDAY GIFT WEBSITE
   =========================================================

   CONTENTS
     1. HELPERS          - small shortcuts used everywhere
     2. SCENE SWITCHING  - shows one scene, hides the rest
     3. SCENE 1          - envelope
     4. SCENE 2          - the music
     5. SCENE 3          - flower garden
     6. SCENE 4          - sticker hunt
     7. SCENE 5          - the letter
     8. SCENE 6          - the wish

   Everything lives inside ONE "DOMContentLoaded" block.
   That means the code waits for the HTML to exist before it
   looks for buttons and images. If you add new code, put it
   INSIDE that block too, or it will not find your elements.
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       1. HELPERS
    ===================================================== */

    // Short way to write document.querySelector
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    // How long the fade between scenes takes (must match style.css)
    const SCENE_FADE_MS = 800;


    // Make an element kick once. The class has to come off again or
    // the animation will not replay on the next change.
    function bump(el) {

        if (!el) {
            return;
        }

        el.classList.remove("bump");

        // Reading offsetWidth forces the browser to apply the removal
        // before we add it back, which is what restarts the animation
        void el.offsetWidth;

        el.classList.add("bump");
    }


    /* =====================================================
       0. THE CONTENT

       Everything the visitor reads comes from content.js. This
       copies it onto the page before anything else runs, so the
       words below are only ever defaults.
    ===================================================== */

    const content = window.GIFT_CONTENT || null;


    // Put text into an element, only if both exist
    function setText(selector, value) {

        if (typeof value !== "string") {
            return;
        }

        const el = document.querySelector(selector);

        if (el) {
            el.textContent = value;
        }
    }


    // Point an image at a new file, only if both exist
    function setImage(selector, value) {

        if (typeof value !== "string" || !value) {
            return;
        }

        const el = document.querySelector(selector);

        if (el) {
            el.src = value;
        }
    }


    function applyContent(c) {

        if (!c) {
            return;
        }

        /* ---- scene 1 ---- */
        if (c.envelope) {
            setText(".envelope-intro p", c.envelope.intro);
            setText(".envelope-intro span", c.envelope.introSmall);
            setText(".card-greeting span", c.envelope.greeting);
            setText("#first-text", c.envelope.line1);
            setText("#second-text", c.envelope.line2);
            setText("#third-text", c.envelope.line3);
            setText("#toGardenScene", c.envelope.button);

            if (c.envelope.photo) {
                const poster = document.querySelector(".little-poster");
                if (poster) {
                    poster.style.backgroundImage = 'url("' + c.envelope.photo + '")';
                }
            }
        }

        /* ---- scene 2 ---- */
        if (c.music) {
            setText(".music-intro", c.music.intro);
            setText("#songTitle", c.music.waiting);
            setText("#songArtist", c.music.waitingSmall);
            setText("#skipMusic", c.music.skip);

            if (Array.isArray(c.music.songs) && c.music.songs[0] &&
                c.music.songs[0].cover) {
                setImage("#albumCover", c.music.songs[0].cover);
            }
        }

        /* ---- scene 3 ---- */
        if (c.garden) {
            setText(".garden-intro h2", c.garden.title);
            setText(".garden-intro p", c.garden.subtitle);
            setText(".letter-hint", c.garden.hint);
            setText(".bouquet-complete h2", c.garden.completeTitle);

            const done = document.querySelectorAll(".bouquet-complete p");
            if (done[0]) { done[0].textContent = c.garden.completeLine1; }
            if (done[1]) { done[1].textContent = c.garden.completeLine2; }

            setText("#patchButton", c.garden.completeButton);
        }

        /* ---- scene 4 ---- */
        if (c.stickers) {
            setText(".sticker-title h1", c.stickers.title);
            setText(".sticker-title p", c.stickers.subtitle);
            setText("#all-found h2", c.stickers.foundTitle);
            setText("#all-found p", c.stickers.foundText);
            setText("#stack-button span", c.stickers.stackButton);
            setText("#stack-button small", c.stickers.stackSmall);
            setText("#download-button", c.stickers.downloadButton);
            setText("#scene4-button", c.stickers.nextButton);

            if (Array.isArray(c.stickers.images)) {

                const tiles = document.querySelectorAll(".hunt-sticker");

                c.stickers.images.forEach(function (src, i) {
                    if (tiles[i] && src) {
                        tiles[i].src = src;
                    }
                });

                if (c.stickers.images[0]) {
                    setImage("#current-sticker", c.stickers.images[0]);
                }
            }
        }

        /* ---- scene 5 ---- */
        if (c.letter) {
            setText(".letter-title", c.letter.title);
            setImage(".photo-a img", c.letter.photo1);
            setImage(".photo-b img", c.letter.photo2);
            setText("#letterNext", c.letter.nextButton);
            setText("#toLastScene", c.letter.doneButton);

            // Rebuild the lines so the count can change freely
            if (Array.isArray(c.letter.lines)) {

                const holder = document.getElementById("letterLines");

                if (holder) {

                    holder.innerHTML = "";

                    c.letter.lines.forEach(function (line) {
                        const p = document.createElement("p");
                        p.className = "letter-line";
                        p.textContent = line;
                        holder.appendChild(p);
                    });
                }
            }
        }

        /* ---- scene 6 ---- */
        if (c.wish) {
            const hintEl = document.getElementById("wishHint");

            if (hintEl) {
                // The hint has a small second line inside a <span>
                const small = hintEl.querySelector("span");
                hintEl.childNodes[0].nodeValue = c.wish.hint + " ";
                if (small) {
                    small.textContent = c.wish.hintSmall;
                }
            }

            setImage(".final-photo", c.wish.photo);
            setText(".final-card h2", c.wish.title);

            const lines = document.querySelectorAll(".final-card p");
            if (lines[0]) { lines[0].textContent = c.wish.line1; }
            if (lines[1]) { lines[1].textContent = c.wish.line2; }

            setText("#replayButton", c.wish.replayButton);
        }
    }


    applyContent(content);


    /* =====================================================
       2. SCENE SWITCHING

       Only one <section class="scene"> is visible at a time.
       The visible one has the class "active".
    ===================================================== */

    function showScene(nextScene) {

        const currentScene = $(".scene.active");

        // Already there, nothing to do
        if (!nextScene || currentScene === nextScene) {
            return;
        }

        // First scene on page load - just show it
        if (!currentScene) {
            nextScene.classList.add("active");
            return;
        }

        // Fade the old scene out, then swap them
        currentScene.classList.add("fade-out");

        setTimeout(function () {
            currentScene.classList.remove("active", "fade-out");
            nextScene.classList.add("active");
            window.scrollTo(0, 0);
        }, SCENE_FADE_MS);
    }


    /* =====================================================
       3. SCENE 1 - ENVELOPE
    ===================================================== */

    const envelopeScene = $("#envelopeScene");
    const openEnvelope = $("#openEnvelope");
    const toGardenScene = $("#toGardenScene");


    // Tapping the heart opens the flap and lifts the card.
    // The whole animation is CSS - we only add the class.
    if (openEnvelope && envelopeScene) {

        openEnvelope.addEventListener("click", function (event) {
            event.stopPropagation();
            envelopeScene.classList.add("open");
        });
    }


    // "Yisyis!!" button - go to the music
    if (toGardenScene) {

        toGardenScene.addEventListener("click", function () {

            // Only allow this once
            if (toGardenScene.disabled) {
                return;
            }
            toGardenScene.disabled = true;

            showScene($("#musicScene"));
        });
    }


    /* =====================================================
       4. SCENE 2 - THE MUSIC

       She taps play, the song starts, and the gift moves on to
       the garden by itself. The music keeps playing from there
       to the end, because the <audio> element lives outside all
       the scenes.

       PALITAN: put your 5 files in the music/ folder and edit the
       titles below. The "cover" is the picture shown while that
       song plays.
    ===================================================== */

    const playlist = (content && content.music && Array.isArray(content.music.songs))
        ? content.music.songs
        : [
            { file: "music/song1.mp3", title: "Song one",   artist: "Artist", cover: "images/photo1.jpg" },
            { file: "music/song2.mp3", title: "Song two",   artist: "Artist", cover: "images/photo2.jpg" },
            { file: "music/song3.mp3", title: "Song three", artist: "Artist", cover: "images/photo1.jpg" },
            { file: "music/song4.mp3", title: "Song four",  artist: "Artist", cover: "images/photo2.jpg" },
            { file: "music/song5.mp3", title: "Song five",  artist: "Artist", cover: "images/photo1.jpg" }
        ];


    const player = $("#player");
    const musicScene = $("#musicScene");
    const musicCard = $(".music-card");
    const albumCover = $("#albumCover");
    const songTitle = $("#songTitle");
    const songArtist = $("#songArtist");
    const playSong = $("#playSong");
    const prevSong = $("#prevSong");
    const nextSong = $("#nextSong");
    const skipMusic = $("#skipMusic");
    const miniPlayer = $("#miniPlayer");

    // How long she sees the song start before the garden slides in
    const MOVE_ON_DELAY = 1400;

    // The shuffled running order, and where we are in it
    let order = [];
    let atSong = 0;
    let hasMovedOn = false;


    // Fisher-Yates: walk backwards, swapping each item with a random
    // earlier one. Gives every order an equal chance.
    function shuffleOrder() {

        order = playlist.map(function (song, i) { return i; });

        for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const keep = order[i];
            order[i] = order[j];
            order[j] = keep;
        }
    }


    function currentSong() {
        return playlist[order[atSong]];
    }


    // Put a song on the player and update the card around it
    function loadSong(startPlaying) {

        const song = currentSong();

        player.src = song.file;

        if (songTitle) {
            songTitle.textContent = song.title;
        }
        if (songArtist) {
            songArtist.textContent = song.artist;
        }

        // Fade the cover out, swap it, fade it back
        if (albumCover && song.cover && albumCover.getAttribute("src") !== song.cover) {

            albumCover.classList.add("swapping");

            setTimeout(function () {
                albumCover.src = song.cover;
                albumCover.classList.remove("swapping");
            }, 300);
        }

        if (startPlaying) {
            startMusic();
        }
    }


    function markPlaying(isPlaying) {

        if (playSong) {
            playSong.classList.toggle("is-playing", isPlaying);
            playSong.innerHTML = isPlaying ? "&#10073;&#10073;" : "&#9654;";
            playSong.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
        }
        if (musicScene) {
            musicScene.classList.toggle("playing", isPlaying);
        }
        if (miniPlayer) {
            miniPlayer.classList.toggle("playing", isPlaying);
        }
    }


    function startMusic() {

        const attempt = player.play();

        // Browsers hand back a promise that fails if the file is
        // missing or the tap was not counted as a gesture
        if (attempt && attempt.catch) {

            attempt.catch(function () {
                markPlaying(false);
                showMissingSongs();
            });
        }
    }


    // If the mp3s are not in the folder yet, say so plainly instead of
    // leaving a dead button
    function showMissingSongs() {

        if (musicCard) {
            musicCard.classList.add("no-songs");
        }
        if (songTitle) {
            songTitle.textContent = "No songs in the music folder yet";
        }
        if (songArtist) {
            songArtist.textContent = "Add song1.mp3 to song5.mp3, then reload";
        }
    }


    // Leave for the garden. Only ever happens once.
    function moveOnFromMusic() {

        if (hasMovedOn) {
            return;
        }
        hasMovedOn = true;

        if (miniPlayer && !player.paused) {
            miniPlayer.hidden = false;
        }

        showScene($("#gardenScene"));
    }


    if (player && playSong) {

        shuffleOrder();
        loadSong(false);

        playSong.addEventListener("click", function () {

            if (player.paused) {

                startMusic();

                // Give her a moment to see it start, then move along
                setTimeout(moveOnFromMusic, MOVE_ON_DELAY);

            } else {
                player.pause();
            }
        });

        prevSong.addEventListener("click", function () {
            atSong = (atSong - 1 + order.length) % order.length;
            loadSong(!player.paused);
        });

        nextSong.addEventListener("click", function () {
            atSong = (atSong + 1) % order.length;
            loadSong(!player.paused);
        });

        // When a song finishes, roll on to the next one in the shuffle
        player.addEventListener("ended", function () {
            atSong = (atSong + 1) % order.length;
            loadSong(true);
        });

        player.addEventListener("play", function () { markPlaying(true); });
        player.addEventListener("pause", function () { markPlaying(false); });

        player.addEventListener("error", function () {
            markPlaying(false);
            showMissingSongs();
        });
    }


    // "Continue without music"
    if (skipMusic) {

        skipMusic.addEventListener("click", function () {
            player.pause();
            moveOnFromMusic();
        });
    }


    // The small control that follows her through the later scenes
    if (miniPlayer) {

        miniPlayer.addEventListener("click", function () {

            if (player.paused) {
                startMusic();
            } else {
                player.pause();
            }
        });
    }


    /* =====================================================
       5. SCENE 3 - FLOWER GARDEN

       How one flower works:
         1. You tap a flower          -> it grows in the middle
         2. A letter slides in        -> shows that flower's message
         3. You close the letter      -> flower drops into the vase
                                         and the counter goes up
    ===================================================== */

    const flowers = $$(".flower");
    const flowerLetter = $("#flowerLetter");
    const letterMessage = $("#letterMessage");
    const closeLetter = $("#closeLetter");
    const flowerCount = $("#flowerCount");
    const bouquetFlowers = $("#bouquetFlowers");
    const bouquetArea = $("#bouquetArea");
    const bouquetComplete = $("#bouquetComplete");
    const patchButton = $("#patchButton");

    const TOTAL_FLOWERS = 16;

    // Wait for the flower to grow before showing the letter
    const LETTER_OPEN_DELAY = 450;

    // Wait for the letter to slide away before dropping the flower
    const LETTER_CLOSE_DELAY = 400;

    // How long the bouquet takes to fly to the middle (matches style.css)
    const BOUQUET_FLY_MS = 1300;


    // One message per flower. The number matches data-flower in the HTML.
    // content.js keeps the messages as a plain list; the click handler
    // looks them up by the flower's number, so turn it into a lookup.
    const flowerMessages = {};

    const messageList = (content && content.garden && Array.isArray(content.garden.messages))
        ? content.garden.messages
        : [
            "I hope today gives you a little reason to smile.",
            "You deserve soft days and happy little moments.",
            "Never forget how special you are.",
            "May something beautiful find you today.",
            "Here's a tiny flower for your tiny happiness.",
            "I hope you keep finding reasons to smile.",
            "Some things are better given quietly.",
            "You make ordinary moments feel a little nicer.",
            "Take this flower as a small reminder to rest.",
            "I hope your heart feels a little lighter today.",
            "You deserve all the gentle things in life.",
            "Keep being your lovely little self.",
            "Here's another flower just because.",
            "I hope this brings a tiny bit of warmth to your day.",
            "May you always have something beautiful to look forward to.",
            "Always remember; YOU ARE LOVED!!"
        ];

    messageList.forEach(function (text, i) {
        flowerMessages[i + 1] = text;
    });



    // --- State -------------------------------------------------
    // pickedFlower : the flower currently held up on screen
    // pickedCount  : how many are already in the vase
    // isBusy       : true while a letter is open OR still animating.
    //                While it is true we ignore new taps, so a fast
    //                tapper cannot start a second flower halfway
    //                through the first one.
    let pickedFlower = null;
    let pickedCount = 0;
    let isBusy = false;


    // Where each tulip sits inside the bouquet.
    // Three rows shaped like a dome: the back row is highest and fans
    // out the most, the front row is lowest and stands straighter.
    // They are listed back row first so later flowers are drawn in
    // front of earlier ones, which is what makes it look layered.
    const bouquetPositions = [

        // back row - tallest, forms the top of the dome
        { left: "6%",  bottom: "44%", rotate: "-22deg" },
        { left: "21%", bottom: "51%", rotate: "-11deg" },
        { left: "35%", bottom: "54%", rotate: "0deg"   },
        { left: "49%", bottom: "51%", rotate: "11deg"  },
        { left: "64%", bottom: "44%", rotate: "22deg"  },

        // middle row
        { left: "0%",  bottom: "22%", rotate: "-20deg" },
        { left: "14%", bottom: "28%", rotate: "-12deg" },
        { left: "28%", bottom: "31%", rotate: "-4deg"  },
        { left: "42%", bottom: "31%", rotate: "4deg"   },
        { left: "56%", bottom: "28%", rotate: "12deg"  },
        { left: "70%", bottom: "22%", rotate: "20deg"  },

        // front row - lowest, stands straightest
        { left: "8%",  bottom: "2%",  rotate: "-13deg" },
        { left: "22%", bottom: "7%",  rotate: "-6deg"  },
        { left: "36%", bottom: "9%",  rotate: "0deg"   },
        { left: "50%", bottom: "7%",  rotate: "6deg"   },
        { left: "62%", bottom: "2%",  rotate: "13deg"  }
    ];


    // Adds a copy of the flower into the vase
    function addFlowerToBouquet(flower, index) {

        if (!bouquetFlowers) {
            return;
        }

        const copy = document.createElement("img");
        copy.src = flower.src;
        copy.alt = "Flower in birthday bouquet";
        copy.classList.add("bouquet-flower");

        const spot = bouquetPositions[index % bouquetPositions.length];
        copy.style.left = spot.left;
        copy.style.bottom = spot.bottom;
        copy.style.transform = "rotate(" + spot.rotate + ")";

        bouquetFlowers.appendChild(copy);
    }


    // Step 1 and 2: tap a flower, show its letter
    flowers.forEach(function (flower) {

        flower.addEventListener("click", function () {

            // Ignore if this flower is already used, or another
            // flower is still being handled
            if (isBusy || flower.classList.contains("picked")) {
                return;
            }

            isBusy = true;
            pickedFlower = flower;

            if (letterMessage) {
                letterMessage.textContent = flowerMessages[flower.dataset.flower];
            }

            // Flower grows in the middle of the screen
            flower.classList.add("picking");

            // Letter slides in once the flower is in place
            setTimeout(function () {
                if (flowerLetter) {
                    flowerLetter.classList.add("show");
                }
            }, LETTER_OPEN_DELAY);
        });
    });


    // Step 3: close the letter and drop the flower into the vase
    function finishPickingFlower() {

        // Nothing is waiting to be finished
        if (!isBusy || !pickedFlower) {
            return;
        }

        // Remember this flower in a local variable straight away.
        // If we read pickedFlower later instead, a fast tap could
        // change it before the timeout below runs, and the wrong
        // flower would end up in the vase.
        const flower = pickedFlower;
        const index = pickedCount;
        pickedFlower = null;

        if (flowerLetter) {
            flowerLetter.classList.remove("show");
        }

        setTimeout(function () {

            addFlowerToBouquet(flower, index);

            flower.classList.remove("picking");
            flower.classList.add("picked");

            pickedCount++;

            if (flowerCount) {
                flowerCount.textContent = pickedCount;
                bump(flowerCount.parentElement);
            }

            // Unlock only now that everything has settled
            isBusy = false;

            if (pickedCount === TOTAL_FLOWERS) {
                setTimeout(showCompletedBouquet, 1000);
            }
        }, LETTER_CLOSE_DELAY);
    }


    /* Move the finished bouquet from the corner to the middle of the
       screen, growing as it goes, then show the "For you" message.

       The move is done with a transform rather than by changing left/
       top, because only transforms animate smoothly. We measure where
       the bouquet is now, work out how far the middle is, and let CSS
       glide it there. */
    function flyBouquetToCentre() {

        if (!bouquetArea) {
            return;
        }

        const box = bouquetArea.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // On a short screen (phone on its side) there is no room to
        // stack the bouquet above the message, so they go side by side:
        // bouquet on the left, message on the right.
        const isShort = vh <= 520;

        const targetX = isShort ? vw * 0.27 : vw / 2;
        const targetY = isShort ? vh * 0.52 : vh * 0.36;

        const moveX = targetX - (box.left + box.width / 2);
        const moveY = targetY - (box.top + box.height / 2);

        // Big enough to admire, but it must still fit the screen
        const grow = Math.min(
            2.4,
            (vw * (isShort ? 0.34 : 0.62)) / box.width,
            (vh * (isShort ? 0.82 : 0.42)) / box.height
        );

        bouquetArea.classList.add("centered");
        bouquetArea.style.transform =
            "translate(" + moveX + "px, " + moveY + "px) scale(" + grow + ")";
    }


    function showCompletedBouquet() {

        flyBouquetToCentre();

        // Let the bouquet land before the message fades in
        setTimeout(function () {
            if (bouquetComplete) {
                bouquetComplete.classList.add("show");
            }
        }, BOUQUET_FLY_MS);
    }


    // The letter closes when you tap the paper or the background
    if (flowerLetter) {

        flowerLetter.addEventListener("click", function (event) {

            const tappedPaper = event.target.closest(".letter-paper");
            const tappedBackground = event.target === flowerLetter;

            if (tappedPaper || tappedBackground) {
                finishPickingFlower();
            }
        });
    }


    // ...or when you tap the little close button
    if (closeLetter) {

        closeLetter.addEventListener("click", function (event) {
            event.stopPropagation();
            finishPickingFlower();
        });
    }


    // "Ready for more?" - go to the sticker hunt
    if (patchButton) {

        patchButton.addEventListener("click", function () {

            if (bouquetComplete) {
                bouquetComplete.classList.remove("show");
            }

            showScene($("#stickerScene"));
        });
    }


    /* =====================================================
       6. SCENE 4 - THE SCRATCH CARD

       The 9 stickers sit in a grid. A canvas painted like pink
       foil covers them. Rubbing the canvas erases the foil, and
       once enough of a sticker is uncovered it counts as found.
    ===================================================== */

    const stickers = $$(".hunt-sticker");
    const stickerCount = $("#sticker-count");
    const allFound = $("#all-found");
    const stickerChoices = $("#sticker-choices");
    const scene4Button = $("#scene4-button");
    const scratchLayer = $("#scratchLayer");

    const foilTitle = (content && content.stickers && content.stickers.foilTitle) || "Scratch me";
    const foilSmall = (content && content.stickers && content.stickers.foilSmall) || "rub with your finger";

    // However many stickers content.js lists. Nothing here assumes 9.
    const TOTAL_STICKERS = stickers.length || 9;

    // How much of a sticker must be uncovered before it counts
    const REVEAL_THRESHOLD = 0.5;

    // Radius of the rubbing brush, as a share of the card width
    const BRUSH_SHARE = 0.11;

    let foundStickers = 0;
    let isRubbing = false;
    let lastCheck = 0;


    // Lay the stickers out to suit both the count and the shape of the
    // screen. Upright phones want more rows; a phone on its side wants
    // more columns, or the tiles end up too small to make out.
    function chooseColumns(count, wide) {

        // Aim for a grid a bit wider than tall in landscape, a bit
        // taller than wide upright
        const target = Math.round(Math.sqrt(count * (wide ? 2 : 0.8)));
        const start = Math.max(2, target);

        // Prefer a column count that divides evenly, so no half-empty
        // last row, but do not wander far from the target
        for (let c = start; c <= start + 2; c++) {
            if (count % c === 0) { return c; }
        }
        for (let c = start; c >= Math.max(2, start - 2); c--) {
            if (count % c === 0) { return c; }
        }

        return start;
    }


    function shapeGrid() {

        const card = document.querySelector(".sticker-hunt");

        if (!card || !TOTAL_STICKERS) {
            return;
        }

        const wide = window.innerHeight <= 520 &&
                     window.innerWidth > window.innerHeight;

        const cols = chooseColumns(TOTAL_STICKERS, wide);
        const rows = Math.ceil(TOTAL_STICKERS / cols);

        card.style.setProperty("--cols", cols);
        card.style.setProperty("--rows", rows);
    }

    shapeGrid();

    // Turning the phone changes which layout suits it
    let shapeTimer = null;

    window.addEventListener("resize", function () {
        clearTimeout(shapeTimer);
        shapeTimer = setTimeout(shapeGrid, 200);
    });


    function markFound(sticker) {

        if (sticker.classList.contains("found")) {
            return;
        }

        sticker.classList.add("found");
        foundStickers++;

        if (stickerCount) {
            stickerCount.textContent = foundStickers + " / " + TOTAL_STICKERS;
            bump(stickerCount);
        }

        if (foundStickers === TOTAL_STICKERS) {

            // Clear whatever foil is left so the card is tidy
            if (scratchLayer) {
                scratchLayer.classList.add("cleared");
            }

            if (allFound) {
                allFound.classList.add("show");
            }
            if (stickerChoices) {
                stickerChoices.classList.add("show");
            }
            if (scene4Button) {
                scene4Button.classList.add("show");
            }
        }
    }


    if (scratchLayer && stickers.length) {

        const ctx = scratchLayer.getContext("2d", { willReadFrequently: true });

        let brush = 20;


        // Paint the foil. Also used again after a resize.
        function paintFoil() {

            const rect = scratchLayer.getBoundingClientRect();

            if (!rect.width || !rect.height) {
                return false;
            }

            // Match the canvas to the screen's pixel density so the
            // foil is not blurry
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            scratchLayer.width = Math.round(rect.width * dpr);
            scratchLayer.height = Math.round(rect.height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            brush = rect.width * BRUSH_SHARE;

            ctx.globalCompositeOperation = "source-over";
            ctx.clearRect(0, 0, rect.width, rect.height);

            const foil = ctx.createLinearGradient(0, 0, rect.width, rect.height);
            foil.addColorStop(0, "#ffc2dd");
            foil.addColorStop(0.5, "#f7a8c4");
            foil.addColorStop(1, "#efb7e0");
            ctx.fillStyle = foil;
            ctx.fillRect(0, 0, rect.width, rect.height);

            // A few soft sparkles so it reads as foil, not flat paint
            for (let i = 0; i < 40; i++) {

                const x = Math.random() * rect.width;
                const y = Math.random() * rect.height;
                const r = 2 + Math.random() * 9;

                ctx.fillStyle = "rgba(255, 255, 255, " + (0.06 + Math.random() * 0.16) + ")";
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = "rgba(255, 255, 255, .82)";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "600 " + Math.round(rect.width * 0.062) + "px Sniglet, sans-serif";
            ctx.fillText(foilTitle, rect.width / 2, rect.height / 2 - rect.width * 0.04);
            ctx.font = Math.round(rect.width * 0.042) + "px Sniglet, sans-serif";
            ctx.fillText(foilSmall, rect.width / 2, rect.height / 2 + rect.width * 0.04);

            // Anything rubbed from here on is erased, not painted
            ctx.globalCompositeOperation = "destination-out";

            return true;
        }


        // Rub a round hole in the foil at a point on the canvas
        function rubAt(x, y) {
            ctx.beginPath();
            ctx.arc(x, y, brush, 0, Math.PI * 2);
            ctx.fill();
        }


        // Join two points so a fast swipe leaves a continuous line
        function rubLine(x1, y1, x2, y2) {

            ctx.lineWidth = brush * 2;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }


        // Read the canvas once, then work out how much of each sticker
        // is showing. Doing it in one pass keeps it cheap.
        function checkStickers() {

            const cardRect = scratchLayer.getBoundingClientRect();

            if (!cardRect.width) {
                return;
            }

            const pixels = ctx.getImageData(
                0, 0, scratchLayer.width, scratchLayer.height
            ).data;

            const scaleX = scratchLayer.width / cardRect.width;
            const scaleY = scratchLayer.height / cardRect.height;

            stickers.forEach(function (sticker) {

                if (sticker.classList.contains("found")) {
                    return;
                }

                const box = sticker.getBoundingClientRect();

                // Sticker position in canvas pixels
                const left = (box.left - cardRect.left) * scaleX;
                const top = (box.top - cardRect.top) * scaleY;
                const wide = box.width * scaleX;
                const tall = box.height * scaleY;

                // Sample a small grid rather than every pixel
                const STEPS = 6;
                let clear = 0;
                let total = 0;

                for (let i = 0; i < STEPS; i++) {
                    for (let j = 0; j < STEPS; j++) {

                        const px = Math.round(left + (wide * (i + 0.5)) / STEPS);
                        const py = Math.round(top + (tall * (j + 0.5)) / STEPS);

                        if (px < 0 || py < 0 ||
                            px >= scratchLayer.width || py >= scratchLayer.height) {
                            continue;
                        }

                        // Index of this pixel's alpha in the data array
                        const alpha = pixels[(py * scratchLayer.width + px) * 4 + 3];

                        total++;
                        if (alpha < 120) {
                            clear++;
                        }
                    }
                }

                if (total && clear / total >= REVEAL_THRESHOLD) {
                    markFound(sticker);
                }
            });
        }


        function pointOn(event) {

            const rect = scratchLayer.getBoundingClientRect();

            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        }


        let last = null;

        scratchLayer.addEventListener("pointerdown", function (event) {

            isRubbing = true;
            last = pointOn(event);
            rubAt(last.x, last.y);

            if (scratchLayer.setPointerCapture) {
                scratchLayer.setPointerCapture(event.pointerId);
            }

            event.preventDefault();
        });


        scratchLayer.addEventListener("pointermove", function (event) {

            if (!isRubbing) {
                return;
            }

            const now = pointOn(event);

            if (last) {
                rubLine(last.x, last.y, now.x, now.y);
            }
            rubAt(now.x, now.y);
            last = now;

            // Checking the pixels is the expensive part, so do it a few
            // times a second rather than on every single move
            const stamp = Date.now();
            if (stamp - lastCheck > 140) {
                lastCheck = stamp;
                checkStickers();
            }

            event.preventDefault();
        });


        function stopRubbing() {

            if (!isRubbing) {
                return;
            }

            isRubbing = false;
            last = null;
            checkStickers();
        }

        scratchLayer.addEventListener("pointerup", stopRubbing);
        scratchLayer.addEventListener("pointercancel", stopRubbing);
        scratchLayer.addEventListener("pointerleave", stopRubbing);


        // Paint once the scene has a size to measure. The card lives in
        // a hidden section until Scene 3 opens, so retry until it does.
        function readyFoil() {

            if (paintFoil()) {
                return;
            }
            setTimeout(readyFoil, 200);
        }

        readyFoil();

        // Re-paint on rotate, keeping already-found stickers uncovered
        let resizeTimer = null;

        window.addEventListener("resize", function () {

            clearTimeout(resizeTimer);

            resizeTimer = setTimeout(function () {

                if (foundStickers >= TOTAL_STICKERS) {
                    return;
                }

                if (!paintFoil()) {
                    return;
                }

                const cardRect = scratchLayer.getBoundingClientRect();

                stickers.forEach(function (sticker) {

                    if (!sticker.classList.contains("found")) {
                        return;
                    }

                    const box = sticker.getBoundingClientRect();

                    rubAt(
                        box.left - cardRect.left + box.width / 2,
                        box.top - cardRect.top + box.height / 2
                    );
                });
            }, 250);
        });
    }


    /* -----------------------------------------------------
       STICKER STACK - one sticker at a time
    ----------------------------------------------------- */

    const stackButton = $("#stack-button");
    const stackViewer = $("#stack-viewer");
    const closeStack = $("#close-stack");
    const currentSticker = $("#current-sticker");
    const stackNumber = $("#stack-number");
    const downloadButton = $("#download-button");
    const nextButton = $("#next-button");
    const previousButton = $("#previous-button");

    // Which sticker the viewer is showing right now
    let currentStickerNumber = 1;


    function showSticker(number) {

        const path = "images/stickers/sticker" + number + ".png";

        if (currentSticker) {
            currentSticker.src = path;
        }
        if (downloadButton) {
            downloadButton.href = path;
        }
        if (stackNumber) {
            stackNumber.textContent = number + " / " + TOTAL_STICKERS;
        }
    }


    if (stackButton && stackViewer) {

        stackButton.addEventListener("click", function () {
            currentStickerNumber = 1;
            showSticker(currentStickerNumber);
            stackViewer.classList.add("show");
        });
    }

    if (closeStack && stackViewer) {

        closeStack.addEventListener("click", function () {
            stackViewer.classList.remove("show");
        });
    }

    // Next - wraps back to 1 after the last one
    if (nextButton) {

        nextButton.addEventListener("click", function () {
            currentStickerNumber++;
            if (currentStickerNumber > TOTAL_STICKERS) {
                currentStickerNumber = 1;
            }
            showSticker(currentStickerNumber);
        });
    }

    // Previous - wraps to the last one when you go below 1
    if (previousButton) {

        previousButton.addEventListener("click", function () {
            currentStickerNumber--;
            if (currentStickerNumber < 1) {
                currentStickerNumber = TOTAL_STICKERS;
            }
            showSticker(currentStickerNumber);
        });
    }


    /* =====================================================
       7. SCENE 5 - THE LETTER

       The message is revealed one line at a time. Each tap of
       "Read on" shows the next <p class="letter-line">. When the
       last one is out, the button swaps for "One more thing".
    ===================================================== */

    const letterScene = $("#letterScene");
    const letterLines = $$(".letter-line");
    const letterNext = $("#letterNext");
    const toLastScene = $("#toLastScene");

    let revealedLines = 0;


    function revealNextLine() {

        if (revealedLines >= letterLines.length) {
            return;
        }

        letterLines[revealedLines].classList.add("show");
        revealedLines++;

        // Keep the newest line in view on a small screen
        letterLines[revealedLines - 1].scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

        // All read - offer the last scene instead
        if (revealedLines >= letterLines.length) {

            if (letterNext) {
                letterNext.classList.add("hide");
            }
            if (toLastScene) {
                toLastScene.classList.add("show");
            }
        }
    }

        // =========================================
// ✍️ HANDWRITTEN LETTER
// =========================================

const handwrittenButton = document.getElementById("handwrittenButton");
const handwrittenViewer = document.getElementById("handwrittenViewer");
const closeHandwritten = document.getElementById("closeHandwritten");

handwrittenButton.addEventListener("click", function () {
    handwrittenViewer.classList.add("show");
});

closeHandwritten.addEventListener("click", function () {
    handwrittenViewer.classList.remove("show");
});

handwrittenViewer.addEventListener("click", function (event) {
    if (event.target === handwrittenViewer) {
        handwrittenViewer.classList.remove("show");
    }
});



    // Start the whole gift over
    if (replayButton) {

        replayButton.addEventListener("click", function () {
            window.location.reload();
        });
    }


    // Start the letter fresh, with the first line already showing
    function startLetter() {

        revealedLines = 0;

        letterLines.forEach(function (line) {
            line.classList.remove("show");
        });

        if (letterNext) {
            letterNext.classList.remove("hide");
        }
        if (toLastScene) {
            toLastScene.classList.remove("show");
        }

        revealNextLine();
    }


    // Scene 3 -> Scene 4
    if (scene4Button) {

        scene4Button.addEventListener("click", function () {
            showScene(letterScene);
            startLetter();
        });
    }

    if (letterNext) {
        letterNext.addEventListener("click", revealNextLine);
    }


    /* =====================================================
       8. SCENE 6 - THE WISH

       Tap the candles to blow them out. The flames go out,
       confetti falls, and the final card fades in.
    ===================================================== */

    const lastScene = $("#lastScene");
    const cake = $("#cake");
    const wishStage = $("#wishStage");
    const finalCard = $("#finalCard");
    const confetti = $("#confetti");
    const replayButton = $("#replayButton");

    const CONFETTI_COLOURS = [
        "#f2678f", "#ffc93c", "#b9a0f0", "#8ec7f0", "#8ed6a8", "#ffffff"
    ];

    let candlesOut = false;


    // Drop a burst of paper confetti down the screen
    function dropConfetti(pieces) {

        if (!confetti) {
            return;
        }

        for (let i = 0; i < pieces; i++) {

            const bit = document.createElement("i");
            const roll = Math.random();

            bit.style.left = Math.random() * 100 + "%";

            if (roll < 0.22) {
                // a heart
                bit.className = "shape-heart";
                bit.textContent = "♥";
                bit.style.color =
                    CONFETTI_COLOURS[Math.floor(Math.random() * CONFETTI_COLOURS.length)];

            } else if (roll < 0.36) {
                // a star
                bit.className = "shape-star";
                bit.textContent = "✦";
                bit.style.color =
                    CONFETTI_COLOURS[Math.floor(Math.random() * CONFETTI_COLOURS.length)];

            } else {
                // a plain paper square
                bit.style.background =
                    CONFETTI_COLOURS[Math.floor(Math.random() * CONFETTI_COLOURS.length)];
            }

            // Spread the pieces out in time and speed so they do not
            // fall as one solid curtain
            bit.style.animationDuration = (2.4 + Math.random() * 2.2) + "s";
            bit.style.animationDelay = (Math.random() * 2.5) + "s";

            confetti.appendChild(bit);

            // Tidy up so the page does not collect thousands of nodes
            bit.addEventListener("animationend", function () {
                bit.remove();
            });
        }
    }


    // Three little curls of smoke rising off the wicks
    function puffSmoke() {

        if (!cake) {
            return;
        }

        ["-28%", "0%", "28%"].forEach(function (offset, i) {

            const puff = document.createElement("span");
            puff.className = "smoke";
            puff.style.marginLeft = offset;
            puff.style.animationDelay = (i * 0.12) + "s";

            cake.appendChild(puff);

            puff.addEventListener("animationend", function () {
                puff.remove();
            });
        });
    }


    function blowOutCandles() {

        if (candlesOut || !cake) {
            return;
        }
        candlesOut = true;

        cake.classList.add("out");

        puffSmoke();
        dropConfetti(70);

        // Let the flames die down, then swap the cake for the message
        setTimeout(function () {

            if (wishStage) {
                wishStage.classList.add("gone");
            }
            if (finalCard) {
                finalCard.classList.add("show");
            }

            dropConfetti(40);

        }, 900);
    }


    if (cake) {
        cake.addEventListener("click", blowOutCandles);
    }


    // Scene 4 -> Scene 5
    if (toLastScene) {

        toLastScene.addEventListener("click", function () {

            showScene(lastScene);

            // Reset in case the gift is being replayed
            candlesOut = false;

            if (cake) {
                cake.classList.remove("out");
            }
            if (wishStage) {
                wishStage.classList.remove("gone");
            }
            if (finalCard) {
                finalCard.classList.remove("show");
            }
        });
    }





    console.log("Birthday website loaded successfully!");

});

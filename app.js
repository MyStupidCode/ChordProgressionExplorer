document.addEventListener('DOMContentLoaded', () => {
    // --- DATA ---
    // The list of chord progressions
    const progressions = {
        "Pop & Rock": {
            "I – V – vi – IV ('Axis of Awesome')": ["I", "V", "vi", "IV"],
            "I – vi – IV – V ('50s Progression')": ["I", "vi", "IV", "V"],
            "vi – IV – I – V ('Sensitive Female')": ["vi", "IV", "I", "V"],
            "I – IV – V – I ('Basic Rock')": ["I", "IV", "V", "I"],
            "I – V – vi – iii – IV – I – IV – V ('Pachelbel\'s Canon')": ["I", "V", "vi", "iii", "IV", "I", "IV", "V"],
            "i – VII – VI – V ('Andalusian Cadence')": ["i", "VII", "VI", "V"],
        },
        "Jazz": {
            "ii – V – I ('The 2-5-1')": ["ii", "V", "I"],
            "I – vi – ii – V ('Rhythm Changes')": ["I", "vi", "ii", "V"],
            "ii° – V – i ('Minor 2-5-1')": ["ii°", "V", "i"],
        },
        "Blues": {
            "12-Bar Blues": ["I", "I", "I", "I", "IV", "IV", "I", "I", "V", "IV", "I", "I"],
            "Minor Blues": ["i", "i", "i", "i", "iv", "iv", "i", "i", "v", "iv", "i", "i"],
        },
        "Cinematic": {
            "i – VI – III – VII ('Epic Progression')": ["i", "VI", "III", "VII"],
            "IV – I – V – vi ('Nostalgic')": ["IV", "I", "V", "vi"],
        }
    };

    // All 12 keys and their properties
    const keys = {
        "C Major": { root: "C", type: "major", accidentals: 0, symbol: "C" },
        "G Major": { root: "G", type: "major", accidentals: 1, symbol: "G" },
        "D Major": { root: "D", type: "major", accidentals: 2, symbol: "D" },
        "A Major": { root: "A", type: "major", accidentals: 3, symbol: "A" },
        "E Major": { root: "E", type: "major", accidentals: 4, symbol: "E" },
        "B Major": { root: "B", type: "major", accidentals: 5, symbol: "B" },
        "F# Major": { root: "F#", type: "major", accidentals: 6, symbol: "F#" },
        "C# Major": { root: "C#", type: "major", accidentals: 7, symbol: "C#" },
        "F Major": { root: "F", type: "major", accidentals: -1, symbol: "F" },
        "Bb Major": { root: "Bb", type: "major", accidentals: -2, symbol: "Bb" },
        "Eb Major": { root: "Eb", type: "major", accidentals: -3, symbol: "Eb" },
        "Ab Major": { root: "Ab", type: "major", accidentals: -4, symbol: "Ab" },
        "Db Major": { root: "Db", type: "major", accidentals: -5, symbol: "Db" },
        "Gb Major": { root: "Gb", type: "major", accidentals: -6, symbol: "Gb" },
        "Cb Major": { root: "Cb", type: "major", accidentals: -7, symbol: "Cb" },
        "A Minor": { root: "A", type: "minor", accidentals: 0, symbol: "Am" },
        "E Minor": { root: "E", type: "minor", accidentals: 1, symbol: "Em" },
        "B Minor": { root: "B", type: "minor", accidentals: 2, symbol: "Bm" },
        // Add other minor keys as needed
    };

    // --- DOM ELEMENTS ---
    const progressionSelect = document.getElementById('progression-select');
    const keySelect = document.getElementById('key-select');
    const rhythmSelect = document.getElementById('rhythm-select');
    const sheetMusicContainer = document.getElementById('sheet-music');

    const { Factory, Stave, StaveNote, StaveConnector, Beam, Formatter, Annotation, Articulation, Voice, Accidental } = Vex.Flow;

    // --- MUSIC THEORY ENGINE ---
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const majorScaleIntervals = [0, 2, 4, 5, 7, 9, 11];
    const minorScaleIntervals = [0, 2, 3, 5, 7, 8, 10]; // Natural minor

    function getScale(root, type) {
        const rootIndex = notes.indexOf(root.charAt(0));
        const intervals = type === 'major' ? majorScaleIntervals : minorScaleIntervals;
        const scale = intervals.map(interval => notes[(rootIndex + interval) % 12]);
        // Basic accidental handling for sharps/flats in key signature
        if (root.includes('#')) return scale.map(n => n.includes('#') ? n : n + '#');
        if (root.includes('b')) return scale.map(n => n.includes('#') ? notes[notes.indexOf(n) - 1] + 'b' : n);
        return scale;
    }

    function getChord(numeral, scale, keyType) {
        const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII"];
        let degree = romanNumerals.indexOf(numeral.toUpperCase().replace('°', ''));
        let quality;

        if (numeral.toLowerCase() === numeral) { // Minor chord
            quality = 'minor';
        } else if (numeral.includes('°')) { // Diminished chord
            quality = 'diminished';
        } else { // Major chord
            quality = 'major';
        }

        const rootNote = scale[degree];
        const rootIndex = notes.indexOf(rootNote.charAt(0));

        let third, fifth;
        if (quality === 'major') {
            third = scale[(degree + 2) % 7];
            fifth = scale[(degree + 4) % 7];
        } else if (quality === 'minor') {
            third = notes[(rootIndex + 3) % 12];
            fifth = scale[(degree + 4) % 7];
        } else { // diminished
            third = notes[(rootIndex + 3) % 12];
            fifth = notes[(rootIndex + 6) % 12];
        }

        // Simple chord name generation
        let chordName = rootNote;
        if (quality === 'minor') chordName += 'm';
        if (quality === 'diminished') chordName += '°';

        return {
            notes: [`${rootNote}/4`, `${third}/4`, `${fifth}/4`],
            name: chordName
        };
    }


    // --- UI INITIALIZATION ---
    function populateProgressions() {
        for (const category in progressions) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category;
            for (const name in progressions[category]) {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                optgroup.appendChild(option);
            }
            progressionSelect.appendChild(optgroup);
        }
    }

    function populateKeys() {
        for (const name in keys) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            keySelect.appendChild(option);
        }
    }

    // --- VEXFLOW RENDERING ---
    function renderProgression() {
        const selectedProgressionName = progressionSelect.value;
        const selectedKeyName = keySelect.value;
        const selectedRhythm = rhythmSelect.value;

        let progressionNumerals;
        // Find the selected progression array
        for (const category in progressions) {
            if (progressions[category][selectedProgressionName]) {
                progressionNumerals = progressions[category][selectedProgressionName];
                break;
            }
        }

        if (!progressionNumerals) return;

        const keyInfo = keys[selectedKeyName];
        const scale = getScale(keyInfo.root, keyInfo.type);

        // Clear previous rendering
        sheetMusicContainer.innerHTML = '';

        const factory = new Factory({
            renderer: { elementId: 'sheet-music', width: sheetMusicContainer.clientWidth, height: 250 },
        });

        const score = factory.EasyScore();
        const system = factory.System();

        const chords = progressionNumerals.map(numeral => getChord(numeral, scale, keyInfo.type));

        let notesToRender = [];
        let annotations = [];

        if (selectedRhythm === 'chords') {
            notesToRender = chords.map(chord => {
                const note = score.notes(`${chord.notes.join(', ')}/w`, { stem: 'up' });
                annotations.push(new Annotation(chord.name).setVerticalJustification(Annotation.VerticalJustify.BOTTOM));
                return note;
            });
        } else { // Arpeggios
            chords.forEach(chord => {
                let arpeggioNotes;
                const duration = '8'; // Eighth notes for arpeggios

                if (selectedRhythm === 'arpeggio-up') {
                    arpeggioNotes = chord.notes;
                } else if (selectedRhythm === 'arpeggio-down') {
                    arpeggioNotes = [...chord.notes].reverse();
                } else { // arpeggio-updown
                    arpeggioNotes = [chord.notes[0], chord.notes[1], chord.notes[2], chord.notes[1]];
                }

                // Add notes to the main array
                arpeggioNotes.forEach((note, index) => {
                    const staveNote = score.notes(`${note}/${duration}`);
                    if (index === 0) {
                        annotations.push(new Annotation(chord.name).setVerticalJustification(Annotation.VerticalJustify.BOTTOM));
                    } else {
                        annotations.push(null); // Placeholder for alignment
                    }
                    notesToRender.push(staveNote);
                });
            });
        }

        // Add annotations to the first note of each group
        notesToRender.forEach((noteGroup, i) => {
            if (annotations[i]) {
                noteGroup[0].addAnnotation(0, annotations[i]);
            }
        });

        const voice = score.voice(notesToRender.flat());

        // Beam arpeggios
        if (selectedRhythm.includes('arpeggio')) {
            const notesPerChord = selectedRhythm === 'arpeggio-updown' ? 4 : 3;
            const beams = [];
            for (let i = 0; i < voice.getTickables().length; i += notesPerChord) {
                const group = voice.getTickables().slice(i, i + notesPerChord);
                if (group.length > 1) {
                    beams.push(new Beam(group));
                }
            }
            factory.draw(); // Draw notes first
            beams.forEach(b => b.setContext(factory.getContext()).draw()); // Then draw beams
        } else {
            factory.draw();
        }

        // Add digital watermark
        const ctx = factory.getContext();
        ctx.save();
        ctx.setFont("Arial", 10, "");
        ctx.fillText("Generated by ChordProgressionPractice.com", 10, 240);
        ctx.restore();
    }


    // --- EVENT LISTENERS ---
    progressionSelect.addEventListener('change', renderProgression);
    keySelect.addEventListener('change', renderProgression);
    rhythmSelect.addEventListener('change', renderProgression);

    // --- INITIALIZATION ---
    populateProgressions();
    populateKeys();
    renderProgression(); // Initial render
});

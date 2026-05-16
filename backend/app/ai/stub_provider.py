"""StubProvider — canned responses so the UI works end-to-end with no API key.

How it works: each pipeline stage stamps `stage_id` on its GenerationRequest.
The stub provider dispatches on that and returns realistic JSON. For clusters,
which must reference exact character indices in the script, we parse the
script back out of the prompt and synthesize ranges that actually match.

This is just for local testing — flip AI_PROVIDER to gemini in .env when
you're ready to use real keys.
"""

from __future__ import annotations

import json
import re

from .provider import AIProvider, GenerationRequest


_TITLES_STUB = {
    "titles": [
        {
            "text": "The Man Who Patented Sliced Bread And Then Forgot About It",
            "hook_style": "character",
            "reasoning": "Leads with a person; the casual 'forgot' implies a longer story.",
        },
        {
            "text": "Why Sliced Bread Was A Terrible Idea For 16 Years",
            "hook_style": "contrarian",
            "reasoning": "Flips the cliché — 'best thing since' becomes 'worst thing for a while'.",
        },
        {
            "text": "There Are Three Reasons Nobody Wanted Sliced Bread",
            "hook_style": "specific_number",
            "reasoning": "Concrete number + counterintuitive premise.",
        },
        {
            "text": "The Bread Slicer That Took Sixteen Years To Catch On",
            "hook_style": "declarative",
            "reasoning": "Flat statement; the time gap does the curiosity work.",
        },
        {
            "text": "What Killed The First Bread-Slicing Machine?",
            "hook_style": "mystery",
            "reasoning": "Question with the implication something went wrong.",
        },
    ]
}


_ROUTES_STUB = {
    "routes": [
        {
            "id": "r1",
            "label": "Inventor's Curse",
            "angle": "A character study of Otto Rohwedder — the obsessive who lost his factory, his patents, and his health chasing the dream.",
            "treatment": "character study",
            "why_this_works": "Single protagonist makes the absurd feel intimate.",
        },
        {
            "id": "r2",
            "label": "Industrial Comedy",
            "angle": "Lean into the deadpan absurdity: bread fell apart, bakers hated it, the slicer cost a fortune, and yet it eventually conquered the world.",
            "treatment": "comedy of errors",
            "why_this_works": "MS Paint loves visual gags; failure is the joke.",
        },
        {
            "id": "r3",
            "label": "Hidden Plumbing",
            "angle": "Use sliced bread as the entry point to explain how industrial supply chains and lunchboxes co-evolved to make it inevitable.",
            "treatment": "systems critique",
            "why_this_works": "Surprising-depth payoff hooks the 'I never thought about that' crowd.",
        },
        {
            "id": "r4",
            "label": "Patent Warfare",
            "angle": "Turn the camera on the patent system — Rohwedder vs. dozens of imitators, the WWII slicing ban, the legal mess after his death.",
            "treatment": "historical deep-dive",
            "why_this_works": "Conflict and legal drama keep tension up across the full runtime.",
        },
    ]
}


_DEEP_DIVE_STUB = {
    "findings": [
        {
            "working_title": "Rohwedder's House Fire",
            "hook": "His first machine and blueprints burned in a 1917 Wisconsin factory fire — he started from scratch.",
            "key_facts": [
                "Fire in 1917 destroyed the prototype",
                "He was being treated for tuberculosis at the time",
                "Recovered the project a decade later",
            ],
            "characters": ["Otto Rohwedder — inventor"],
            "tensions": ["He bet his health and savings on a bread machine"],
            "sources_hint": "Smithsonian Magazine profile",
            "confidence": "high",
        },
        {
            "working_title": "The Bakers Hated It",
            "hook": "Commercial bakers refused to buy the machine because sliced bread went stale twice as fast.",
            "key_facts": [
                "Sliced bread stales faster than whole loaves",
                "Wax paper wrapping was the workaround",
                "Frank Bench at Chillicothe Baking Co was the first to bite, July 7 1928",
            ],
            "characters": ["Frank Bench — first commercial buyer"],
            "tensions": ["Product worked, market wasn't ready"],
            "sources_hint": "Chillicothe Constitution-Tribune, July 1928",
            "confidence": "high",
        },
        {
            "working_title": "Wonder Bread's Hostile Takeover",
            "hook": "Wonder Bread didn't invent sliced bread, but a 1930 nationwide marketing blitz made the world think they did.",
            "key_facts": [
                "Continental Baking launched sliced loaf in 1930",
                "Outspent every competitor on radio advertising",
                "Still credited in surveys today",
            ],
            "characters": ["Continental Baking Company"],
            "tensions": ["The inventor never got the credit"],
            "sources_hint": "Trade ad archives",
            "confidence": "medium",
        },
        {
            "working_title": "The Wartime Ban",
            "hook": "In January 1943 the U.S. government banned sliced bread to save steel — and reversed itself two months later after public outrage.",
            "key_facts": [
                "Banned January 18 1943",
                "Reversed March 8 1943",
                "Claude Wickard, Secretary of Agriculture, took the heat",
            ],
            "characters": ["Claude Wickard"],
            "tensions": ["Bureaucratic logic vs lunchbox revolt"],
            "sources_hint": "NYT archive Jan-Mar 1943",
            "confidence": "high",
        },
        {
            "working_title": "Why The Phrase Stuck",
            "hook": "'Greatest thing since sliced bread' became canon in the 1950s — coined to sell something else entirely.",
            "key_facts": [
                "Phrase from a 1952 Wonder Bread competitor's ad",
                "Otto Rohwedder died in 1960 nearly broke",
            ],
            "characters": [],
            "tensions": ["The inventor was forgotten while his phrase outlived him"],
            "sources_hint": "Quote Investigator",
            "confidence": "medium",
        },
    ]
}


_ORGANIZE_STUB = {
    "stories": [
        {
            "id": "story-1",
            "title": "Otto Rohwedder Bet Everything On Bread",
            "logline": "A jeweler with tuberculosis lost his factory, his blueprints, and his savings to invent a machine nobody wanted.",
            "beats": [
                "Cold open: he's coughing in a burning factory",
                "Context: he sold his jewelry stores to fund the prototype",
                "The turn: eleven years later the first bakery says yes",
                "Payoff: he dies broke, his phrase outlives him",
            ],
            "tone_hint": "somber-with-a-smirk",
            "needs_visuals": [
                "a man in a vest holding blueprints",
                "a small factory on fire",
                "a jewelry shop with a SOLD sign",
            ],
        },
        {
            "id": "story-2",
            "title": "The Bakers Said No",
            "logline": "Why sliced bread sat in storage for years: it staled twice as fast, and the wrapper hadn't been invented yet.",
            "beats": [
                "Hook: imagine making bread that breaks in a day",
                "Context: bakers' main objection was freshness",
                "Wax paper wrapping changes the math",
                "Frank Bench in Chillicothe takes the bet",
            ],
            "tone_hint": "deadpan",
            "needs_visuals": [
                "a baker scowling at a slicer",
                "wax paper rolls",
                "a small-town storefront",
            ],
        },
        {
            "id": "story-3",
            "title": "The Time America Banned Sliced Bread",
            "logline": "For 52 days in 1943 the U.S. outlawed pre-sliced loaves to save steel — and the public lost its mind.",
            "beats": [
                "Cold open: a 1943 housewife yelling at a radio",
                "Context: wartime rationing",
                "The ban and the steel argument",
                "52 days of letters, columns, and the reversal",
            ],
            "tone_hint": "incredulous",
            "needs_visuals": [
                "a stick figure shouting at a radio",
                "a steel-stamped NO over a loaf",
                "a calendar tearing pages",
            ],
        },
    ]
}


# Three canned scripts. The stub script writer picks one based on the story_id
# it sees in the prompt — so each story tab in the UI gets distinct text.
_SCRIPT_TEMPLATES: list[dict] = [
    {
        "story_id": "story-1",
        "title": "Otto Rohwedder Bet Everything On Bread",
        "script": (
            "In 1917, a jeweler in Wisconsin watched his factory burn down and didn't seem all that surprised. "
            "He had been spending other people's money on a machine to slice bread, which was, at the time, a thing nobody asked for and many people had specifically refused to consider.\n\n"
            "His name was Otto Rohwedder. He had tuberculosis, three jewelry stores he was actively selling off, and a prototype that had just been turned into a small mound of ash. He went back to the drawing board, because what else are you going to do.\n\n"
            "It took him eleven more years. Eleven years of bakers telling him no, of investors politely walking out of meetings, of a recurring cough that should have ended the project on medical grounds alone. Then in July of 1928, a baker named Frank Bench in Chillicothe, Missouri said yes. One man, in one town, with one machine that wrapped the slices in wax paper so they wouldn't dry out. It worked.\n\n"
            "Within two years, sliced bread was everywhere. Within five, it was a cliché. Within ten, the phrase 'greatest thing since sliced bread' had entered the language as a kind of joke about how nothing was ever that great.\n\n"
            "Otto died in 1960, mostly broke. His machine had reshaped American kitchens, sandwich shops, lunchboxes, and the entire industrial supply chain that fed them. The phrase named after his invention had become a stand-in for any invention ever, anywhere. He himself was a footnote, which is to say, he was nothing at all."
        ),
        "target_seconds": 180,
    },
    {
        "story_id": "story-2",
        "title": "The Bakers Said No",
        "script": (
            "Here is the part nobody tells you. When sliced bread was invented, the bakers hated it. Not in a 'we have concerns' way. In a 'please leave our shop' way.\n\n"
            "The complaint was simple. A whole loaf stays fresh for days because the crust seals in the moisture. Slice it ahead of time and you've punched dozens of little doorways for the moisture to leave through. Your beautiful loaf becomes a brick by Wednesday.\n\n"
            "So for years, salesmen carried Rohwedder's machine from bakery to bakery, demonstrated the slicer, watched the bread crumble apart on the counter, and got walked out. The product worked. The problem was that the product was several years ahead of the wrapper.\n\n"
            "Then someone — and this part is genuinely contested — paired the slicer with a paraffin wax paper wrap that sealed the cut edges. The math changed. Stale-by-Wednesday became stale-by-Friday, which was, suddenly, fine.\n\n"
            "The first commercial bakery to actually buy a slicer was the Chillicothe Baking Company in Missouri, July 1928. The owner's name was Frank Bench. The town's newspaper ran a half-page article about it that read, in retrospect, like a slow-motion gold rush. Within two years, every bakery in America was either selling sliced bread or losing customers to one that was. Frank Bench, by the way, also died broke. The whole industry seemed to specialize in that."
        ),
        "target_seconds": 180,
    },
    {
        "story_id": "story-3",
        "title": "The Time America Banned Sliced Bread",
        "script": (
            "January 18, 1943. The United States was at war on two fronts, rationing was in full swing, and the Secretary of Agriculture went on the radio and announced that sliced bread was now illegal.\n\n"
            "His name was Claude Wickard, and his reasoning was, in a wartime way, almost coherent. Sliced bread needed thicker wrapping to stay fresh. Thicker wrapping used more wax. The wax came from petroleum. The petroleum needed to go to the war. Therefore, no slicing.\n\n"
            "Americans found this completely unacceptable. The bread itself was the same bread. You could buy a whole loaf and slice it at home with the same knife you'd been using for the previous decade. Nothing about the war effort was actually advanced by anyone's wrist getting more exercise.\n\n"
            "The reaction was a slow-rolling national tantrum. Housewives wrote angry letters. Columnists wrote angrier columns. One letter to The New York Times opened with the phrase 'I should like to let you know how important sliced bread is to the morale and saneness of a household.' It was signed by a woman who had four children and a husband at the front.\n\n"
            "Fifty-two days later, on March 8, 1943, Wickard quietly reversed the ban. The official explanation was a re-calculation of wax supplies. The unofficial explanation was that you cannot win a world war on the home front if you are also fighting a war with the home front. Sliced bread was back, and never left again."
        ),
        "target_seconds": 180,
    },
]


def _generic_script_template(story_id: str, title_hint: str) -> dict:
    return {
        "story_id": story_id,
        "title": title_hint or f"Story {story_id}",
        "script": (
            "This is a stub script. The real script writer is wired up but you're running the app with AI_PROVIDER=stub for local testing, "
            "so the system is returning canned text instead of calling Gemini. Flip AI_PROVIDER to gemini and set GEMINI_API_KEY in backend/.env to see real output.\n\n"
            "Even in stub mode the rest of the pipeline runs end-to-end: the deep diver returned findings, the organizer turned them into stories, "
            "and this script is being passed to the cluster analyzer, which will slice it into colored chunks you can hover over.\n\n"
            "Hovering a colored span should show a 'draw this' note — that's the MS Paint brief the cluster analyzer attaches to each chunk."
        ),
        "target_seconds": 180,
    }


def _script_for_prompt(prompt: str) -> dict:
    """Pick a canned script that matches the story_id embedded in the prompt.
    Falls back to a generic stub script so the UI still works for unknown ids."""
    id_match = re.search(r'"id"\s*:\s*"([^"]+)"', prompt)
    title_match = re.search(r'"title"\s*:\s*"([^"]+)"', prompt)
    story_id = id_match.group(1) if id_match else "story-1"
    title_hint = title_match.group(1) if title_match else ""
    for t in _SCRIPT_TEMPLATES:
        if t["story_id"] == story_id:
            return t
    return _generic_script_template(story_id, title_hint)


_CLUSTER_PALETTE_NAMES = [
    "stage entrance", "wide shot", "close-up", "graph overlay", "labelled diagram",
    "object hero shot", "split panel", "newspaper clipping", "calendar tear",
    "speech bubble", "map view", "before/after", "pointing arrow", "punchline frame",
]


def _clusters_for_prompt(prompt: str) -> dict:
    """The cluster analyzer's contract is strict — indices must point into the
    real script. Parse the script out of the prompt and split it at sentence
    boundaries into roughly 10 chunks.
    """
    script_match = re.search(r'\"\"\"(.*?)\"\"\"', prompt, re.DOTALL)
    if not script_match:
        return {"clusters": []}
    script = script_match.group(1)

    sentence_ends = [m.end() for m in re.finditer(r"[.!?](?:\s|\n|$)", script)]
    if not sentence_ends or sentence_ends[-1] < len(script):
        sentence_ends.append(len(script))

    target_clusters = 10
    step = max(1, len(sentence_ends) // target_clusters)
    boundaries = [0]
    for i in range(step, len(sentence_ends), step):
        boundaries.append(sentence_ends[i])
        if len(boundaries) - 1 >= target_clusters:
            break
    if boundaries[-1] < len(script):
        boundaries.append(len(script))

    clusters = []
    for i in range(len(boundaries) - 1):
        start, end = boundaries[i], boundaries[i + 1]
        if end <= start:
            continue
        clusters.append(
            {
                "id": f"c{i+1}",
                "start": start,
                "end": end,
                "label": _CLUSTER_PALETTE_NAMES[i % len(_CLUSTER_PALETTE_NAMES)],
                "suggested_image": f"stub MS Paint brief #{i+1} — replace this with real cluster analysis by setting AI_PROVIDER=gemini",
                "scene_description": "Stub data — every cluster gets the same placeholder. With a real provider each gets a unique drawing brief.",
            }
        )
    return {"clusters": clusters}


_DISPATCH: dict[str, object] = {
    "title_forge": _TITLES_STUB,
    "route_mapper": _ROUTES_STUB,
    "deep_dive": _DEEP_DIVE_STUB,
    "organize": _ORGANIZE_STUB,
}


class StubProvider(AIProvider):
    name = "stub"

    async def generate(self, req: GenerationRequest) -> str:
        stage = req.stage_id or ""
        if stage == "script":
            return json.dumps(_script_for_prompt(req.prompt))
        if stage == "clusters":
            return json.dumps(_clusters_for_prompt(req.prompt))
        canned = _DISPATCH.get(stage)
        if canned is not None:
            return json.dumps(canned)
        return json.dumps({"_stub": True, "stage_id": stage})

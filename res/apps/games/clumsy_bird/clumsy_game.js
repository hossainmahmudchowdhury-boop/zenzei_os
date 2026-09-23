var game = {
    data: {
        score : 0,
        steps: 0,
        start: false,
        newHiScore: false,
        muted: false
    },

    resources: [
            // images
        {name: "bg", type:"image", src: "../../../assets/bg.png"},
        {name: "clumsy", type:"image", src: "../../../assets/clumsy.png"},
        {name: "pipe", type:"image", src: "../../../assets/pipe.png"},
        {name: "logo", type:"image", src: "../../../assets/logo (1).png"},
        {name: "ground", type:"image", src: "../../../assets/ground.png"},
        {name: "gameover", type:"image", src: "../../../assets/gameover.png"},
        {name: "gameoverbg", type:"image", src: "../../../assets/gameoverbg.png"},
        {name: "hit", type:"image", src: "../../../assets/hit.png"},
        {name: "getready", type:"image", src: "../../../assets/getready.png"},
        {name: "new", type:"image", src: "../../../assets/new.png"},
        {name: "share", type:"image", src: "../../../assets/share.png"},
        {name: "tweet", type:"image", src: "../../../assets/tweet.png"},
        // sounds
        {name: "theme", type: "audio", src: "../../../assets/theme.mp3"},
        {name: "hit", type: "audio", src: "../../../assets/hit.mp3"},
        {name: "lose", type: "audio", src: "../../../assets/lose.mp3"},
        {name: "wing", type: "audio", src: "../../../assets/wing.mp3"},

    ],

    "onload": function() {
        if (!me.video.init(900, 600, {
            wrapper: "screen",
            scale : "auto",
            scaleMethod: "fit"
        })) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }
        me.audio.init("mp3,ogg");
        me.loader.preload(game.resources, this.loaded.bind(this));
    },

    "loaded": function() {
        me.state.set(me.state.MENU, new game.TitleScreen());
        me.state.set(me.state.PLAY, new game.PlayScreen());
        me.state.set(me.state.GAME_OVER, new game.GameOverScreen());

        me.input.bindKey(me.input.KEY.SPACE, "fly", true);
        me.input.bindKey(me.input.KEY.M, "mute", true);
        me.input.bindPointer(me.input.KEY.SPACE);

        me.pool.register("clumsy", game.BirdEntity);
        me.pool.register("pipe", game.PipeEntity, true);
        me.pool.register("hit", game.HitEntity, true);
        me.pool.register("ground", game.Ground, true);

        me.state.change(me.state.MENU);
    }
};
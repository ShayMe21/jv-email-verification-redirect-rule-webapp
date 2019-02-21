function (user, context, callback) {
    console.log(`migration-redirect client_id=${context.clientID}`);
    // for test purposes limiting this rule execution only to sample-spa-02
    if(context.clientID === 'zKuWas1TjOi1gw5AZjqSDBk6MUNvRkzC') {
        if(!user.email_verified) {
        // redirect to our custom webapp which will ask user to select primary email
        context.redirect = {
            // this web app is secured by same auth0 tenant as the SPA
            url: "http://localhost:3000/verify-email?id="+user.user_id.split('|')[1]
        };
        }
    }
    callback(null, user, context);
}
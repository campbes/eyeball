describe("EyeballUtil",function() {

     it("tests that getDbQuery returns the proper query object",function(){
         require('url').init({
             query : {
                 build : "jeff,smith",
                 tag : "badgers",
                 start : "010101",
                 url : "test.com"
             }
         });
         var query = EyeballUtil().getDbQuery({});
         expect(query.build.$in[1]).toBe("smith");
         expect(query.tag).toBe("badgers");
         expect(query.timestamp.$gte.getTime()).toBe(256589596800000);
         expect(query.url.$regex).toBe("test.com");
     });

});
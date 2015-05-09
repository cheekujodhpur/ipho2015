db.users.find({logged:true},{"ip":true,"type":true,"country_code":true,"country_name":true}).toArray()

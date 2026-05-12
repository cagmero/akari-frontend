const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://qqtxutiyafkqzowahpvx.supabase.co', 'sb_publishable_w09iocN3SGgL-9lEIP2d_Q_-ow9xi8A');
supabase.from('waitlist').insert([{ name: 'test', email: 'test@example.com', entity: 'Test', location: 'Test', volume: 'Test' }])
  .then(res => console.log(res));

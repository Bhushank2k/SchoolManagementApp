import React,{useEffect,useState} from 'react';
import {ActivityIndicator,View,Text,Alert} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StatusBar} from 'expo-status-bar';
import {initDB} from './src/database/db';
import {needsSetup} from './src/auth/auth';
import {syncNow,getSetting} from './src/sync/syncEngine';
import AuthScreen from './src/components/AuthScreen';
import DashboardScreen from './src/components/DashboardScreen';
import StudentsScreen from './src/components/StudentsScreen';
import AttendanceScreen from './src/components/AttendanceScreen';
import StaffScreen from './src/components/StaffScreen';
import ExportScreen from './src/components/ExportScreen';
import SettingsScreen from './src/components/SettingsScreen';
import ImportScreen from './src/components/ImportScreen';
const Tab=createBottomTabNavigator();
export default function App(){
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[setup,setSetup]=useState(false),[user,setUser]=useState(null),[sessionKey,setSessionKey]=useState(0);
 useEffect(()=>{(async()=>{try{await initDB();setSetup(await needsSetup());setReady(true);}catch(e){setError(String(e?.message||e));}})();},[]);
 useEffect(()=>{if(!user)return;let busy=false;const attempt=async()=>{if(busy)return;try{if(!(await getSetting('syncUrl')).trim())return;busy=true;await syncNow();}catch(_e){/* Offline errors are retried on the next interval/foreground event. */}finally{busy=false;}};const timer=setInterval(attempt,300000);const sub=AppState.addEventListener('change',state=>{if(state==='active')attempt();});attempt();return()=>{clearInterval(timer);sub.remove();};},[user?.id]);
 if(!ready)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#f3f6fb',padding:24}}>{!error?<ActivityIndicator size="large" color="#155eef"/>:null}<Text style={{marginTop:12,color:error?'#b91c1c':'#334155',textAlign:'center'}}>{error?`Could not open the database: ${error}`:'Preparing school database…'}</Text></View>;
 if(!user)return <><StatusBar style="dark"/><AuthScreen setup={setup} onAuthenticated={u=>{setUser(u);setSetup(false);setSessionKey(k=>k+1);}}/></>;
 const admin=user.role==='admin';
 return <NavigationContainer key={sessionKey}><StatusBar style="light"/><Tab.Navigator screenOptions={{headerStyle:{backgroundColor:'#123b70'},headerTintColor:'#fff',tabBarActiveTintColor:'#155eef',tabBarLabelStyle:{fontSize:11},tabBarStyle:{height:62,paddingBottom:7,paddingTop:5}}}>
 <Tab.Screen name="Home" component={DashboardScreen} options={{title:'School Dashboard'}}/>
 <Tab.Screen name="Students" component={StudentsScreen}/><Tab.Screen name="Attendance" component={AttendanceScreen}/>
 {admin?<Tab.Screen name="Staff" component={StaffScreen}/>:null}<Tab.Screen name="Reports" component={ExportScreen}/><Tab.Screen name="Import" component={ImportScreen}/>
 <Tab.Screen name="Settings" options={{title:`Settings · ${user.displayName}`}}>{props=><SettingsScreen {...props} user={user} onLogout={()=>{setUser(null);setSetup(false);}}/>}</Tab.Screen>
 </Tab.Navigator></NavigationContainer>;
}

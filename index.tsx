import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// Screens
function CameraScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>Camera Screen</Text>
    </View>
  );
}

function LogsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>Scan Logs Screen</Text>
    </View>
  );
}

function InfoScreen() {
  return (
    <ScrollView style={infoStyles.container}>

      {/* Header */}
      <View style={infoStyles.header}>
        <Text style={infoStyles.title}>AquaBond</Text>
        <Text style={infoStyles.subtitle}>
          PFAS-free, biodegradable bandage kits
        </Text>
      </View>

      {/* About Section */}
      <View style={infoStyles.card}>
        <Text style={infoStyles.sectionTitle}>🌍 About the Project</Text>
        <Text style={infoStyles.body}>
          AquaBond is a platform designed to help communities monitor water
          quality and environmental conditions using real-time color detection
          and mobile technology. Our system connects a smart camera scanner
          with a web dashboard to make environmental data accessible and easy
          to understand.
        </Text>
      </View>

      {/* Website Section */}
      <View style={infoStyles.card}>
        <Text style={infoStyles.sectionTitle}>Our Website</Text>
        <Text style={infoStyles.body}>
          ----add info
        </Text>
      </View>

      {/* Developers Section */}
      <View style={infoStyles.card}>
        <Text style={infoStyles.sectionTitle}>About Our Team</Text>
        <Text style={infoStyles.body}>
          We are a student-led team from the Morris County School of Technology committed to creating sustainable healthcare solutions. Aquabond was founded and developed by Neestha Kapadia, Nysa Vadaliya, Joseph Sangem, and Neel Ranadive. AquaBond focuses on PFAS-free wound care that protects both people and the environment while increasing global accessibility.
        </Text>
      </View>

      {/* Mission Section */}
      <View style={infoStyles.card}>
        <Text style={infoStyles.sectionTitle}>Our Mission</Text>
        <Text style={infoStyles.body}>
          Everyday, 40 million people suffer from chronic wounds, with regions like the Sub-Saharan having infection risks reaching 18% from the lack of hygienic care. WIth Aquabond, our mission is to break restricted access to proper aid and reduce the environmental impact of PFAS/forever chemicals from 65% of bandages worldwide. PFAS may be effective, but harmful, as prolonged exposure to PFAS can bring on various cancers, fertility and developmental issues, thyroid and liver issues, and more. With Aquabond, we want to stop this exposure, by making our bandages made from natural algaes like Spirulina and Cholerlla Algae. These materials of our bandaids do the same if not better than what PFAS can do. Additionally, our bandaids are biodegradable, so after usage, they don't create a pile of toxic waste but degrade into the environment over time. So, our mission not only aims to stop people running the risk of various infections, but revolutinize the healthcare industry, change the daily lives of people for the good, and make our environment a safer and better place to live. So join Aquabond on our mission, not just as consumers but as partners and advocates.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// Tab Navigator
const Tab = createBottomTabNavigator();

export default function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          elevation: 8,
          height: 65,
        },
        tabBarActiveTintColor: '#2E7D5B',
        tabBarInactiveTintColor: '#9BB8A9',
      }}
    >
      <Tab.Screen name="Camera" component={CameraScreen} />
      <Tab.Screen name="Logs" component={LogsScreen} />
      <Tab.Screen name="Info" component={InfoScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6FBF8',
  },
  text: {
    color: '#2E7D5B',
    fontSize: 20,
    fontWeight: '600',
  },
});

const infoStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FBF8',
    paddingHorizontal: 18,
  },

  header: {
    marginTop: 60,
    marginBottom: 24,
  },

  title: {
    color: '#1F5E46',
    fontSize: 34,
    fontWeight: '700',
  },

  subtitle: {
    color: '#5F8F7B',
    fontSize: 16,
    marginTop: 6,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,

    shadowColor: '#2E7D5B',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  sectionTitle: {
    color: '#2E7D5B',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },

  body: {
    color: '#3E5F54',
    fontSize: 15,
    lineHeight: 23,
  },
});
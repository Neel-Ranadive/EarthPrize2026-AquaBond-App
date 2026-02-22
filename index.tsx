import { Text, View } from "react-native";
import { Image, StyleSheet } from 'react-native';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "black"
      }}
    >
      <View style={styles.card1}>

        <Text style={styles.textName}>
          Nysa Vadaliya
        </Text>

        <Image
          source={{ uri: 'https://www.google.com/url?sa=t&source=web&rct=j&url=https%3A%2F%2Fwww.istockphoto.com%2Fphotos%2Fapple&ved=0CBYQjRxqFwoTCNDW9P6635IDFQAAAAAdAAAAABAH&opi=89978449' }}
          style={{ width: 100, height: 100 }}
        />

        <Text
          style={{
            fontSize: 18,
            marginTop: 8,
            color: "white",
          }}
        >
          student
        </Text>

        <Text
          style={{
            fontSize: 14,
            marginTop: 8,
            color: "white",
          }}
        >
          studying and working
        </Text>






      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card1: {
    backgroundColor: "silver",
    borderRadius: 10,
    padding: 5,
    alignItems: "center",
    width: 300,
    justifyContent: "center"
  },
  textName: {

    fontSize: 24,
    fontWeight: "bold",
    color: "gray",
  }
});
